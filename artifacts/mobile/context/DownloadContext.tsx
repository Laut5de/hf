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
let MediaLibrary: any = null;
let TaskManager: any = null;

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

try {
  MediaLibrary = require("expo-media-library");
} catch {}

try {
  TaskManager = require("expo-task-manager");
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

interface PausedDownloadData {
  subjectId: string;
  title: string;
  coverUrl: string;
  coverBlurHash?: string;
  genre: string;
  duration: number;
  quality: number;
  fileSize: number;
  filePath: string;
  proxyUrl: string;
  savableState: any;
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
  pauseDownload: (subjectId: string) => Promise<void>;
  resumeDownload: (subjectId: string) => Promise<void>;
  cancelDownload: (subjectId: string) => void;
  removeDownload: (subjectId: string) => Promise<void>;
  isDownloaded: (subjectId: string) => boolean;
  isDownloading: (subjectId: string) => boolean;
  isPaused: (subjectId: string) => boolean;
  getDownloadProgress: (subjectId: string) => number;
  getDownloadPath: (subjectId: string) => string | null;
  shareDownload: (subjectId: string) => Promise<void>;
  totalStorageUsed: number;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

const DOWNLOADS_KEY = "jmhstream_downloads";
const PAUSED_KEY = "jmhstream_paused_downloads";

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

async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  if (!MediaLibrary) return true;
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return true;
  }
}

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();
  const [downloads, setDownloads] = useState<DownloadedItem[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<ActiveDownload[]>([]);
  const resumablesRef = useRef<Record<string, any>>({});
  const cancelledRef = useRef<Set<string>>(new Set());
  const pausedRef = useRef<Set<string>>(new Set());
  const pausedDataRef = useRef<Record<string, PausedDownloadData>>({});
  const startDownloadRef = useRef<((params: any) => Promise<void>) | null>(null);

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
        const pausedRaw = await AsyncStorage.getItem(PAUSED_KEY);
        if (pausedRaw) {
          const pausedItems: PausedDownloadData[] = JSON.parse(pausedRaw);
          const pausedMap: Record<string, PausedDownloadData> = {};
          const pausedActive: ActiveDownload[] = [];
          for (const p of pausedItems) {
            pausedMap[p.subjectId] = p;
            let downloadedBytes = 0;
            try {
              const info = await FS.getInfoAsync(p.filePath);
              if (info.exists && info.size) downloadedBytes = info.size;
            } catch {}
            pausedActive.push({
              subjectId: p.subjectId,
              title: p.title,
              progress: p.fileSize > 0 ? downloadedBytes / p.fileSize : 0,
              totalBytes: p.fileSize,
              downloadedBytes,
              status: "paused",
            });
          }
          pausedDataRef.current = pausedMap;
          if (pausedActive.length > 0) {
            setActiveDownloads((prev) => [...prev, ...pausedActive]);
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

  const persistPaused = useCallback(async () => {
    const items = Object.values(pausedDataRef.current);
    if (items.length > 0) {
      await AsyncStorage.setItem(PAUSED_KEY, JSON.stringify(items));
    } else {
      await AsyncStorage.removeItem(PAUSED_KEY);
    }
  }, []);

  const isDownloaded = useCallback(
    (subjectId: string) => downloads.some((d) => d.subjectId === subjectId),
    [downloads]
  );

  const isDownloading = useCallback(
    (subjectId: string) => activeDownloads.some((d) => d.subjectId === subjectId && d.status === "downloading"),
    [activeDownloads]
  );

  const isPaused = useCallback(
    (subjectId: string) => activeDownloads.some((d) => d.subjectId === subjectId && d.status === "paused"),
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

  const finishDownload = useCallback(async (
    params: { subjectId: string; title: string; coverUrl: string; coverBlurHash?: string; genre: string; duration: number },
    quality: number,
    filePath: string
  ) => {
    let actualSize = 0;
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
      quality,
      fileSize: actualSize,
      filePath,
      downloadedAt: Date.now(),
    };

    setDownloads((prev) => {
      const next = [newItem, ...prev];
      persistDownloads(next);
      return next;
    });
  }, [persistDownloads]);

  const runDownload = useCallback(async (
    subjectId: string,
    proxyUrl: string,
    filePath: string,
    params: { subjectId: string; title: string; coverUrl: string; coverBlurHash?: string; genre: string; duration: number },
    quality: number,
    fileSize: number,
    resumeData?: any
  ) => {
    const progressCallback = (data: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => {
      const progress = data.totalBytesExpectedToWrite > 0
        ? data.totalBytesWritten / data.totalBytesExpectedToWrite
        : 0;
      setActiveDownloads((prev) =>
        prev.map((d) =>
          d.subjectId === subjectId
            ? { ...d, progress, downloadedBytes: data.totalBytesWritten, totalBytes: data.totalBytesExpectedToWrite, status: "downloading" as const }
            : d
        )
      );
    };

    let downloadResumable: any;
    if (resumeData) {
      downloadResumable = new FS.DownloadResumable(
        proxyUrl,
        filePath,
        {},
        progressCallback,
        resumeData
      );
    } else {
      downloadResumable = FS.createDownloadResumable(
        proxyUrl,
        filePath,
        {},
        progressCallback
      );
    }
    resumablesRef.current[subjectId] = downloadResumable;

    try {
      const result = resumeData
        ? await downloadResumable.resumeAsync()
        : await downloadResumable.downloadAsync();

      if (cancelledRef.current.has(subjectId)) {
        try { await FS.deleteAsync(filePath, { idempotent: true }); } catch {}
        cancelledRef.current.delete(subjectId);
        delete pausedDataRef.current[subjectId];
        persistPaused();
        setActiveDownloads((prev) => prev.filter((d) => d.subjectId !== subjectId));
        delete resumablesRef.current[subjectId];
        return;
      }
      if (pausedRef.current.has(subjectId)) {
        pausedRef.current.delete(subjectId);
        delete resumablesRef.current[subjectId];
        return;
      }
      if (result) {
        await finishDownload(params, quality, filePath);
        delete pausedDataRef.current[subjectId];
        persistPaused();
        setActiveDownloads((prev) => prev.filter((d) => d.subjectId !== subjectId));
        delete resumablesRef.current[subjectId];
      }
    } catch (err: any) {
      if (cancelledRef.current.has(subjectId)) {
        try { await FS.deleteAsync(filePath, { idempotent: true }); } catch {}
        cancelledRef.current.delete(subjectId);
        delete pausedDataRef.current[subjectId];
        persistPaused();
        setActiveDownloads((prev) => prev.filter((d) => d.subjectId !== subjectId));
        delete resumablesRef.current[subjectId];
      } else if (pausedRef.current.has(subjectId)) {
        pausedRef.current.delete(subjectId);
        delete resumablesRef.current[subjectId];
      } else {
        setActiveDownloads((prev) =>
          prev.map((d) =>
            d.subjectId === subjectId ? { ...d, status: "error" as const } : d
          )
        );
        delete resumablesRef.current[subjectId];
        Alert.alert("Download Failed", "Could not download this content. Please try again.");
      }
    }
  }, [finishDownload, persistPaused]);

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

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert("Permission Required", "Storage permission is needed to download content. Please grant it in Settings.");
      return;
    }

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
    const proxyUrl = source.proxyUrl || source.url;

    const fileName = `${params.subjectId}_${source.resolution}p.mp4`;
    const filePath = getDownloadDir() + fileName;
    const fileSize = parseInt(source.size, 10) || 0;

    setActiveDownloads((prev) => [
      ...prev,
      {
        subjectId: params.subjectId,
        title: params.title,
        progress: 0,
        totalBytes: fileSize,
        downloadedBytes: 0,
        status: "downloading",
      },
    ]);

    pausedDataRef.current[params.subjectId] = {
      subjectId: params.subjectId,
      title: params.title,
      coverUrl: params.coverUrl,
      coverBlurHash: params.coverBlurHash,
      genre: params.genre,
      duration: params.duration,
      quality: source.resolution,
      fileSize,
      filePath,
      proxyUrl,
      savableState: null,
    };

    await runDownload(params.subjectId, proxyUrl, filePath, params, source.resolution, fileSize);
  }, [isDownloaded, isDownloading, settings.downloadQuality, settings.downloadOnWifiOnly, runDownload]);

  const pauseDownload = useCallback(async (subjectId: string) => {
    const resumable = resumablesRef.current[subjectId];
    if (!resumable) return;

    pausedRef.current.add(subjectId);

    try {
      const saveData = await resumable.pauseAsync();
      if (pausedDataRef.current[subjectId]) {
        pausedDataRef.current[subjectId].savableState = saveData;
        await persistPaused();
      }
    } catch {
      pausedRef.current.delete(subjectId);
    }

    setActiveDownloads((prev) =>
      prev.map((d) =>
        d.subjectId === subjectId ? { ...d, status: "paused" as const } : d
      )
    );
  }, [persistPaused]);

  const resumeDownload = useCallback(async (subjectId: string) => {
    const paused = pausedDataRef.current[subjectId];
    if (!paused) return;

    if (settings.downloadOnWifiOnly) {
      try {
        const netState = await NetInfo.fetch();
        if (netState.type !== "wifi") {
          Alert.alert("Wi-Fi Required", "Connect to Wi-Fi to resume download.");
          return;
        }
      } catch {}
    }

    if (!paused.savableState) {
      delete pausedDataRef.current[subjectId];
      persistPaused();
      setActiveDownloads((prev) => prev.filter((d) => d.subjectId !== subjectId));
      Alert.alert(
        "Cannot Resume",
        "This download cannot be resumed. Would you like to restart it?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restart",
            onPress: () => {
              try { FS.deleteAsync(paused.filePath, { idempotent: true }); } catch {}
              startDownloadRef.current?.({
                subjectId: paused.subjectId,
                title: paused.title,
                coverUrl: paused.coverUrl,
                coverBlurHash: paused.coverBlurHash,
                genre: paused.genre,
                duration: paused.duration,
              });
            },
          },
        ]
      );
      return;
    }

    setActiveDownloads((prev) =>
      prev.map((d) =>
        d.subjectId === subjectId ? { ...d, status: "downloading" as const } : d
      )
    );

    const params = {
      subjectId: paused.subjectId,
      title: paused.title,
      coverUrl: paused.coverUrl,
      coverBlurHash: paused.coverBlurHash,
      genre: paused.genre,
      duration: paused.duration,
    };

    await runDownload(
      subjectId,
      paused.proxyUrl,
      paused.filePath,
      params,
      paused.quality,
      paused.fileSize,
      paused.savableState
    );
  }, [settings.downloadOnWifiOnly, runDownload, persistPaused]);

  startDownloadRef.current = startDownload;

  const cancelDownload = useCallback((subjectId: string) => {
    cancelledRef.current.add(subjectId);
    const resumable = resumablesRef.current[subjectId];
    if (resumable) {
      try { resumable.pauseAsync(); } catch {}
      delete resumablesRef.current[subjectId];
    }
    delete pausedDataRef.current[subjectId];
    persistPaused();
    setActiveDownloads((prev) => prev.filter((d) => d.subjectId !== subjectId));
    const filePath = getDownloadDir() + `${subjectId}_`;
    if (FS) {
      FS.getInfoAsync(getDownloadDir()).then((dirInfo: any) => {
        if (!dirInfo.exists) return;
        FS.readDirectoryAsync(getDownloadDir()).then((files: string[]) => {
          files.filter((f: string) => f.startsWith(subjectId)).forEach((f: string) => {
            FS.deleteAsync(getDownloadDir() + f, { idempotent: true }).catch(() => {});
          });
        }).catch(() => {});
      }).catch(() => {});
    }
  }, [persistPaused]);

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
        pauseDownload,
        resumeDownload,
        cancelDownload,
        removeDownload,
        isDownloaded,
        isDownloading,
        isPaused,
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
