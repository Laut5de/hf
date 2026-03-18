import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
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
import { ALL_MEDIA, Media } from "@/data/mockData";

const TRENDING_SEARCHES = [
  "Dark Horizon",
  "Sci-Fi",
  "Thriller",
  "New Releases",
  "Action",
  "Series",
];

const GENRE_CATEGORIES = [
  { id: "sci-fi", title: "Sci-Fi", color: "#4F46E5", items: ALL_MEDIA.filter((m) => m.genre.includes("Sci-Fi")) },
  { id: "thriller", title: "Thriller", color: "#DC2626", items: ALL_MEDIA.filter((m) => m.genre.includes("Thriller")) },
  { id: "action", title: "Action", color: "#D97706", items: ALL_MEDIA.filter((m) => m.genre.includes("Action")) },
  { id: "drama", title: "Drama", color: "#059669", items: ALL_MEDIA.filter((m) => m.genre.includes("Drama")) },
  { id: "crime", title: "Crime", color: "#7C3AED", items: ALL_MEDIA.filter((m) => m.genre.includes("Crime")) },
  { id: "mystery", title: "Mystery", color: "#0891B2", items: ALL_MEDIA.filter((m) => m.genre.includes("Mystery")) },
];

function SearchResultItem({ item }: { item: Media }) {
  return (
    <Pressable
      style={styles.resultItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/detail/[id]", params: { id: item.id } });
      }}
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.resultThumb}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.resultMeta}>
          {item.year} • {item.type === "series" ? `${item.seasons?.length} Season${(item.seasons?.length ?? 0) > 1 ? "s" : ""}` : item.duration} • {item.rating}
        </Text>
        <View style={styles.resultGenres}>
          {item.genre.slice(0, 2).map((g) => (
            <View key={g} style={styles.genreChip}>
              <Text style={styles.genreChipText}>{g}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.resultScore}>
        <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
        <Text style={styles.scoreStar}>★</Text>
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useApp();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ALL_MEDIA.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genre.some((g) => g.toLowerCase().includes(q)) ||
        m.cast.some((c) => c.toLowerCase().includes(q))
    );
  }, [query]);

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      if (text.trim().length > 2) {
        addRecentSearch(text.trim());
      }
    },
    [addRecentSearch]
  );

  const handleTrendingPress = (term: string) => {
    setQuery(term);
    addRecentSearch(term);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const showResults = query.trim().length > 0;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
          <Feather name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search titles, genres, cast..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={handleSearch}
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
        /* Search Results */
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
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
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 }}
        >
          {/* Recent Searches */}
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

          {/* Trending */}
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

          {/* Genre Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse by Genre</Text>
            <View style={styles.genreGrid}>
              {GENRE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.genreCard, { backgroundColor: cat.color + "33" }]}
                  onPress={() => handleTrendingPress(cat.title)}
                >
                  {cat.items[0] && (
                    <Image
                      source={{ uri: cat.items[0].thumbnail }}
                      style={styles.genreCardBg}
                      contentFit="cover"
                    />
                  )}
                  <View style={[styles.genreCardOverlay, { backgroundColor: cat.color + "99" }]} />
                  <Text style={styles.genreCardText}>{cat.title}</Text>
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
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  genreCard: {
    width: "47%",
    height: 90,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 12,
  },
  genreCardBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  genreCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  genreCardText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    zIndex: 1,
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
    height: 55,
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
