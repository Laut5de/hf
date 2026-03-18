import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, Platform } from "react-native";
import { fetchSources } from "@/data/api";
import { useApp } from "@/context/AppContext";
import type { DownloadQuality } from "@/context/AppContext";

let FS: any = null;
let SharingModule: any = null;

try {
  FS = require("expo-file-system/legacy");
} catch {
  try {
    FS = require("expo-file-system");
  } catch {}
}

try {
  SharingModule = require("expo-sharing");
} catch {}

export interface DownloadedItem {
  subjectId: string;
  title: string;
  coverUrl: string;
  coverBlurHash?: string;
  genre: string;
  duration: number;
  quality: number;
  fileSize: number;
  filePath: string;
  downloadedAt: number;
}

export interface ActiveDownload {
  subjectId: string;
  title: string;
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
  status: "downloading" | "paused" | "error";
}

interface DownloadContextType {
  downloads: DownloadedItem[];
  activeDownloads: ActiveDownload[];
  startDownload: (params: {
    subjectId: string;
    title: string;
    coverUrl: string;
    coverBlurHash?: string;
    genre: string;
    duration: number;
  }) => Promise<void>;
  cancelDownload: (subjectId: string) => void;
  removeDownload: (subjectId: string) => Promise<void>;
  isDownloaded: (subjectId: string) => boolean;
  isDownloading: (subjectId: string) => boolean;
  getDownloadProgress: (subjectId: string) => number;
  getDownloadPath: (subjectId: string) => string | null;
  shareDownload: (subjectId: string) => Promise<void>;
  totalStorageUsed: number;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

const DOWNLOADS_KEY = "jmhstream_downloads";

function getDownloadDir() {
  if (!FS?.documentDirectory) return "";
  return FS.documentDirectory + "downloads/";
}

function qualityToResolution(q: DownloadQuality): number {
  switch (q) {
    case "standard": return 480;
    case "high": return 720;
    case "ultra": return 1080;
    default: return 720;
  }
}

const isNative = Platform.OS !== "web";

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();
  const [downloads, setDownloads] = useState<DownloadedItem[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<ActiveDownload[]>([]);
  const resumablesRef = useRef<Record<string, any>>({});
  const cancelledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isNative || !FS) return;
    (async () => {
      try {
        const data = await AsyncStorage.getItem(DOWNLOADS_KEY);
        if (data) {
          const items: DownloadedItem[] = JSON.parse(data);
          const verified: DownloadedItem[] = [];
          for (const item of items) {
            try {
              const info = await FS.getInfoAsync(item.filePath);
              if (info.exists) {
                verified.push(item);
              }
            } catch {
              verified.push(item);
            }
          }
          setDownloads(verified);
          if (verified.length !== items.length) {
            await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(verified));
          }
        }
      } catch {}

      try {
        const dir = getDownloadDir();
        if (dir) {
          const dirInfo = await FS.getInfoAsync(dir);
          if (!dirInfo.exists) {
            await FS.makeDirectoryAsync(dir, { intermediates: true });
          }
        }
      } catch {}
    })();
  }, []);

  const persistDownloads = useCallback(async (items: DownloadedItem[]) => {
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(items));
  }, []);

  const isDownloaded = useCallback(
    (subjectId: string) => downloads.some((d) => d.subjectId === subjectId),
    [downloads]
  );

  const isDownloading = useCallback(
    (subjectId: string) => activeDownloads.some((d) => d.subjectId === subjectId),
    [activeDownloads]
  );

  const getDownloadProgress = useCallback(
    (subjectId: string) => {
      const active = activeDownloads.find((d) => d.subjectId === subjectId);
      return active ? active.progress : 0;
    },
    [activeDownloads]
  );

  const getDownloadPath = useCallback(
    (subjectId: string) => {
      const item = downloads.find((d) => d.subjectId === subjectId);
      return item ? item.filePath : null;
    },
    [downloads]
  );

  const startDownload = useCallback(async (params: {
    subjectId: string;
    title: string;
    coverUrl: string;
    coverBlurHash?: string;
    genre: string;
    duration: number;
  }) => {
    if (!isNative || !FS) {
      Alert.alert("Downloads", "Downloads are only available on mobile devices.");
      return;
    }
    if (isDownloaded(params.subjectId) || isDownloading(params.subjectId)) return;

    if (settings.downloadOnWifiOnly) {
      try {
        const netState = await NetInfo.fetch();
        if (netState.type !== "wifi") {
          Alert.alert(
            "Wi-Fi Required",
            "You have 'Download on Wi-Fi Only' enabled. Connect to Wi-Fi or change this in Settings.",
            [{ text: "OK" }]
          );
          return;
        }
      } catch {}
    }

    try {
      const dir = getDownloadDir();
      if (dir) {
        const dirInfo = await FS.getInfoAsync(dir);
        if (!dirInfo.exists) {
          await FS.makeDirectoryAsync(dir, { intermediates: true });
        }
      }
    } catch {}

    const sourcesData = await fetchSources(params.subjectId);
    if (!sourcesData || sourcesData.downloads.length === 0) {
      Alert.alert("Download Error", "No download sources available for this content.");
      return;
    }

    const targetRes = qualityToResolution(settings.downloadQuality);
    const sorted = [...sourcesData.downloads].sort(
      (a, b) => Math.abs(a.resolution - targetRes) - Math.abs(b.resolution - targetRes)
    );
    const source = sorted[0];

    const fileName = `${params.subjectId}_${source.resolution}p.mp4`;
    const filePath = getDownloadDir() + fileName;

    setActiveDownloads((prev) => [
      ...prev,
      {
        subjectId: params.subjectId,
        title: params.title,
        progress: 0,
        totalBytes: parseInt(source.size, 10) || 0,
        downloadedBytes: 0,
        status: "downloading",
      },
    ]);

    const progressCallback = (data: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => {
      const progress = data.totalBytesExpectedToWrite > 0
        ? data.totalBytesWritten / data.totalBytesExpectedToWrite
        : 0;
      setActiveDownloads((prev) =>
        prev.map((d) =>
          d.subjectId === params.subjectId
            ? {
                ...d,
                progress,
                downloadedBytes: data.totalBytesWritten,
                totalBytes: data.totalBytesExpectedToWrite,
              }
            : d
        )
      );
    };

    const downloadResumable = FS.createDownloadResumable(
      source.url,
      filePath,
      {},
      progressCallback
    );
    resumablesRef.current[params.subjectId] = downloadResumable;

    try {
      const result = await downloadResumable.downloadAsync();
      if (cancelledRef.current.has(params.subjectId)) {
        try { await FS.deleteAsync(filePath, { idempotent: true }); } catch {}
        return;
      }
      if (result) {
        let actualSize = parseInt(source.size, 10) || 0;
        try {
          const fileInfo = await FS.getInfoAsync(filePath);
          if (fileInfo.exists && fileInfo.size) {
            actualSize = fileInfo.size;
          }
        } catch {}

        const newItem: DownloadedItem = {
          subjectId: params.subjectId,
          title: params.title,
          coverUrl: params.coverUrl,
          coverBlurHash: params.coverBlurHash,
          genre: params.genre,
          duration: params.duration,
          quality: source.resolution,
          fileSize: actualSize,
          filePath,
          downloadedAt: Date.now(),
        };

        setDownloads((prev) => {
          const next = [newItem, ...prev];
          persistDownloads(next);
          return next;
        });
      }
    } catch (err: any) {
      if (cancelledRef.current.has(params.subjectId)) {
        try { await FS.deleteAsync(filePath, { idempotent: true }); } catch {}
      } else {
        try { await FS.deleteAsync(filePath, { idempotent: true }); } catch {}
        Alert.alert("Download Failed", "Could not download this content. Please try again.");
      }
    } finally {
      cancelledRef.current.delete(params.subjectId);
      setActiveDownloads((prev) =>
        prev.filter((d) => d.subjectId !== params.subjectId)
      );
      delete resumablesRef.current[params.subjectId];
    }
  }, [isDownloaded, isDownloading, settings.downloadQuality, settings.downloadOnWifiOnly, persistDownloads]);

  const cancelDownload = useCallback((subjectId: string) => {
    cancelledRef.current.add(subjectId);
    const resumable = resumablesRef.current[subjectId];
    if (resumable) {
      try { resumable.pauseAsync(); } catch {}
      delete resumablesRef.current[subjectId];
    }
    setActiveDownloads((prev) => prev.filter((d) => d.subjectId !== subjectId));
  }, []);

  const removeDownload = useCallback(async (subjectId: string) => {
    const item = downloads.find((d) => d.subjectId === subjectId);
    if (item && FS) {
      try {
        await FS.deleteAsync(item.filePath, { idempotent: true });
      } catch {}
    }
    setDownloads((prev) => {
      const next = prev.filter((d) => d.subjectId !== subjectId);
      persistDownloads(next);
      return next;
    });
  }, [downloads, persistDownloads]);

  const shareDownload = useCallback(async (subjectId: string) => {
    const item = downloads.find((d) => d.subjectId === subjectId);
    if (!item || !SharingModule) return;
    try {
      const available = await SharingModule.isAvailableAsync();
      if (!available) {
        Alert.alert("Sharing not available", "Sharing is not available on this device.");
        return;
      }
      await SharingModule.shareAsync(item.filePath, {
        mimeType: "video/mp4",
        dialogTitle: item.title,
      });
    } catch {}
  }, [downloads]);

  const totalStorageUsed = downloads.reduce((sum, d) => sum + d.fileSize, 0);

  return (
    <DownloadContext.Provider
      value={{
        downloads,
        activeDownloads,
        startDownload,
        cancelDownload,
        removeDownload,
        isDownloaded,
        isDownloading,
        getDownloadProgress,
        getDownloadPath,
        shareDownload,
        totalStorageUsed,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownloads() {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error("useDownloads must be used within DownloadProvider");
  return ctx;
}
