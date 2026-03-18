import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ALL_MEDIA, Media, MOCK_DOWNLOADS } from "@/data/mockData";

interface AppContextType {
  watchlist: string[];
  downloads: Media[];
  recentSearches: string[];
  addToWatchlist: (id: string) => void;
  removeFromWatchlist: (id: string) => void;
  isInWatchlist: (id: string) => boolean;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  removeDownload: (id: string) => void;
  getMediaById: (id: string) => Media | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

const WATCHLIST_KEY = "jmhstream_watchlist";
const SEARCHES_KEY = "jmhstream_recent_searches";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<Media[]>(MOCK_DOWNLOADS);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [wl, searches] = await Promise.all([
          AsyncStorage.getItem(WATCHLIST_KEY),
          AsyncStorage.getItem(SEARCHES_KEY),
        ]);
        if (wl) setWatchlist(JSON.parse(wl));
        if (searches) setRecentSearches(JSON.parse(searches));
      } catch {}
    };
    load();
  }, []);

  const addToWatchlist = useCallback(async (id: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback(async (id: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((i) => i !== id);
      AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isInWatchlist = useCallback(
    (id: string) => watchlist.includes(id),
    [watchlist]
  );

  const addRecentSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const next = [query, ...prev.filter((q) => q !== query)].slice(0, 8);
      AsyncStorage.setItem(SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([]);
    AsyncStorage.removeItem(SEARCHES_KEY);
  }, []);

  const removeDownload = useCallback((id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const getMediaById = useCallback(
    (id: string) => ALL_MEDIA.find((m) => m.id === id),
    []
  );

  return (
    <AppContext.Provider
      value={{
        watchlist,
        downloads,
        recentSearches,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        addRecentSearch,
        clearRecentSearches,
        removeDownload,
        getMediaById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
