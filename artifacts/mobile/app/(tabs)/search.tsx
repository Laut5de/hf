import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { ApiSubject, fetchSearch, getGenres, getYear, formatDuration } from "@/data/api";

const TRENDING_SEARCHES = [
  "One Piece",
  "Horror",
  "Action",
  "K-Drama",
  "Anime",
  "Nollywood",
];

function SearchResultItem({ item }: { item: ApiSubject }) {
  const genres = getGenres(item.genre);
  const year = getYear(item.releaseDate);
  const isSeries = item.subjectType === 2;

  return (
    <Pressable
      style={styles.resultItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/detail/[id]", params: { id: item.subjectId } });
      }}
    >
      <Image
        source={{ uri: item.cover?.url }}
        style={styles.resultThumb}
        contentFit="cover"
        transition={200}
        placeholder={item.cover?.blurHash ? { blurhash: item.cover.blurHash } : undefined}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.resultMeta}>
          {year}{year ? " · " : ""}{isSeries ? "Series" : formatDuration(item.duration) || "Movie"}{item.countryName ? ` · ${item.countryName}` : ""}
        </Text>
        <View style={styles.resultGenres}>
          {genres.slice(0, 2).map((g) => (
            <View key={g} style={styles.genreChip}>
              <Text style={styles.genreChipText}>{g}</Text>
            </View>
          ))}
        </View>
      </View>
      {item.imdbRatingValue && parseFloat(item.imdbRatingValue) > 0 && (
        <View style={styles.resultScore}>
          <Text style={styles.scoreText}>{parseFloat(item.imdbRatingValue).toFixed(1)}</Text>
          <Text style={styles.scoreStar}>★</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useApp();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<ApiSubject[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const debounce = setTimeout(async () => {
      setSearching(true);
      setSearchError(false);
      try {
        const data = await fetchSearch(query.trim());
        setResults(data);
        addRecentSearch(query.trim());
      } catch {
        setSearchError(true);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleTrendingPress = (term: string) => {
    setQuery(term);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const showResults = query.trim().length >= 2;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.searchBarContainer}>
        <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
          <Feather name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies, series, genres..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {showResults ? (
        searching ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : searchError ? (
          <View style={styles.empty}>
            <Feather name="wifi-off" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Search failed</Text>
            <Text style={styles.emptyText}>Check your connection and try again</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.subjectId}
            renderItem={({ item }) => <SearchResultItem item={item} />}
            contentContainerStyle={[
              styles.resultsList,
              { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 },
            ]}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="film" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>Try a different title or genre</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 }}
        >
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.recentItem}
                  onPress={() => handleTrendingPress(s)}
                >
                  <Feather name="clock" size={15} color={COLORS.textMuted} />
                  <Text style={styles.recentText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Searches</Text>
            <View style={styles.trendingGrid}>
              {TRENDING_SEARCHES.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.trendingChip}
                  onPress={() => handleTrendingPress(term)}
                >
                  <Feather name="trending-up" size={13} color={COLORS.primary} />
                  <Text style={styles.trendingText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBarFocused: {
    borderColor: COLORS.primary,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  clearText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  trendingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  trendingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trendingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  resultsList: {
    paddingTop: 4,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  resultThumb: {
    width: 80,
    height: 110,
    borderRadius: 6,
  },
  resultInfo: {
    flex: 1,
    gap: 4,
  },
  resultTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  resultMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  resultGenres: {
    flexDirection: "row",
    gap: 6,
  },
  genreChip: {
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  genreChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  resultScore: {
    alignItems: "center",
  },
  scoreText: {
    color: COLORS.accentGold,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  scoreStar: {
    color: COLORS.accentGold,
    fontSize: 10,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
