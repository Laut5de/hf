import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ApiSubject } from "@/data/api";

interface SavedItem {
  subjectId: string;
  subjectType: number;
  title: string;
  genre: string;
  cover: { url: string; blurHash?: string };
  releaseDate: string;
  imdbRatingValue: string;
  countryName: string;
  detailPath: string;
  duration: number;
  savedAt: number;
}

interface AppContextType {
  myList: SavedItem[];
  recentSearches: string[];
  addToMyList: (item: ApiSubject) => void;
  removeFromMyList: (subjectId: string) => void;
  isInMyList: (subjectId: string) => boolean;
  isInWatchlist: (subjectId: string) => boolean;
  addToWatchlist: (subjectId: string) => void;
  removeFromWatchlist: (subjectId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const MYLIST_KEY = "jmhstream_mylist";
const SEARCHES_KEY = "jmhstream_recent_searches";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [myList, setMyList] = useState<SavedItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [listData, searches] = await Promise.all([
          AsyncStorage.getItem(MYLIST_KEY),
          AsyncStorage.getItem(SEARCHES_KEY),
        ]);
        if (listData) setMyList(JSON.parse(listData));
        if (searches) setRecentSearches(JSON.parse(searches));
      } catch {}
    };
    load();
  }, []);

  const addToMyList = useCallback((item: ApiSubject) => {
    setMyList((prev) => {
      if (prev.some((s) => s.subjectId === item.subjectId)) return prev;
      const saved: SavedItem = {
        subjectId: item.subjectId,
        subjectType: item.subjectType,
        title: item.title,
        genre: item.genre,
        cover: {
          url: item.cover?.url || "",
          blurHash: item.cover?.blurHash,
        },
        releaseDate: item.releaseDate,
        imdbRatingValue: item.imdbRatingValue,
        countryName: item.countryName,
        detailPath: item.detailPath,
        duration: item.duration,
        savedAt: Date.now(),
      };
      const next = [saved, ...prev];
      AsyncStorage.setItem(MYLIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromMyList = useCallback((subjectId: string) => {
    setMyList((prev) => {
      const next = prev.filter((i) => i.subjectId !== subjectId);
      AsyncStorage.setItem(MYLIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isInMyList = useCallback(
    (subjectId: string) => myList.some((i) => i.subjectId === subjectId),
    [myList]
  );

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const next = [query, ...prev.filter((q) => q !== query)].slice(0, 8);
      AsyncStorage.setItem(SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    AsyncStorage.removeItem(SEARCHES_KEY);
  }, []);

  return (
    <AppContext.Provider
      value={{
        myList,
        recentSearches,
        addToMyList,
        removeFromMyList,
        isInMyList,
        isInWatchlist: isInMyList,
        addToWatchlist: (id: string) => {
          const placeholder: ApiSubject = {
            subjectId: id,
            subjectType: 1,
            title: "",
            description: "",
            releaseDate: "",
            duration: 0,
            genre: "",
            cover: { url: "", width: 0, height: 0 },
            countryName: "",
            imdbRatingValue: "",
            hasResource: false,
            detailPath: "",
            imdbRatingCount: 0,
            corner: "",
            postTitle: "",
          };
          addToMyList(placeholder);
        },
        removeFromWatchlist: removeFromMyList,
        addRecentSearch,
        clearRecentSearches,
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
