import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { ApiSubject, fetchSearch, fetchTrending, getGenres, getYear } from "@/data/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GENRE_CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

const GENRE_CATEGORIES = [
  { name: "Action", icon: "flash-outline" as const, gradient: ["#E50914", "#B20710"] },
  { name: "Horror", icon: "skull-outline" as const, gradient: ["#7C3AED", "#4C1D95"] },
  { name: "Anime", icon: "color-palette-outline" as const, gradient: ["#F59E0B", "#D97706"] },
  { name: "K-Drama", icon: "heart-outline" as const, gradient: ["#EC4899", "#BE185D"] },
  { name: "Comedy", icon: "happy-outline" as const, gradient: ["#10B981", "#047857"] },
  { name: "Nollywood", icon: "film-outline" as const, gradient: ["#F97316", "#C2410C"] },
  { name: "Adventure", icon: "compass-outline" as const, gradient: ["#3B82F6", "#1D4ED8"] },
  { name: "Romance", icon: "rose-outline" as const, gradient: ["#F43F5E", "#BE123C"] },
];

function SearchResultItem({ item, index }: { item: ApiSubject; index: number }) {
  const genres = getGenres(item.genre);
  const year = getYear(item.releaseDate);
  const isSeries = item.subjectType === 2;
  const rating = item.imdbRatingValue ? parseFloat(item.imdbRatingValue) : 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
      <Pressable
        style={styles.resultItem}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/detail/[id]", params: { id: item.subjectId } });
        }}
      >
        <View style={styles.resultPosterWrap}>
          <Image
            source={{ uri: item.cover?.url }}
            style={styles.resultPoster}
            contentFit="cover"
            transition={200}
            placeholder={item.cover?.blurHash ? { blurhash: item.cover.blurHash } : undefined}
          />
          {isSeries && (
            <View style={styles.resultTypeBadge}>
              <Text style={styles.resultTypeBadgeText}>Series</Text>
            </View>
          )}
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.resultMetaRow}>
            {year ? <Text style={styles.resultMetaText}>{year}</Text> : null}
            {item.countryName ? (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.resultMetaText}>{item.countryName}</Text>
              </>
            ) : null}
          </View>
          <View style={styles.resultGenres}>
            {genres.slice(0, 2).map((g) => (
              <View key={g} style={styles.genreChip}>
                <Text style={styles.genreChipText}>{g}</Text>
              </View>
            ))}
          </View>
          {rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={COLORS.accentGold} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <Text style={styles.ratingLabel}>IMDb</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function TrendingItem({ item, rank }: { item: ApiSubject; rank: number }) {
  const genres = getGenres(item.genre);

  return (
    <Pressable
      style={styles.trendingItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/detail/[id]", params: { id: item.subjectId } });
      }}
    >
      <Text style={styles.trendingRank}>{rank}</Text>
      <Image
        source={{ uri: item.cover?.url }}
        style={styles.trendingPoster}
        contentFit="cover"
        transition={200}
        placeholder={item.cover?.blurHash ? { blurhash: item.cover.blurHash } : undefined}
      />
      <View style={styles.trendingInfo}>
        <Text style={styles.trendingTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trendingGenre} numberOfLines={1}>
          {genres.slice(0, 2).join(" · ")}
        </Text>
      </View>
    </Pressable>
  );
}

function GenreCard({ genre, onPress }: { genre: typeof GENRE_CATEGORIES[0]; onPress: () => void }) {
  return (
    <Pressable style={styles.genreCard} onPress={onPress}>
      <LinearGradient
        colors={genre.gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.genreCardGradient}
      >
        <Ionicons name={genre.icon} size={22} color="rgba(255,255,255,0.9)" />
        <Text style={styles.genreCardText}>{genre.name}</Text>
      </LinearGradient>
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

  const { data: trendingData } = useQuery({
    queryKey: ["trending"],
    queryFn: fetchTrending,
    staleTime: 10 * 60 * 1000,
  });

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

  const handleGenrePress = (genreName: string) => {
    setQuery(genreName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const showResults = query.trim().length >= 2;
  const trendingItems = trendingData?.slice(0, 5) || [];

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Search</Text>
        <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
          <Feather name="search" size={18} color={isFocused ? COLORS.primary : COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Movies, series, genres..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery("")}
              style={styles.clearBtn}
              hitSlop={8}
            >
              <Feather name="x" size={16} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {showResults ? (
        searching ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.searchingText}>Searching...</Text>
          </View>
        ) : searchError ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Feather name="wifi-off" size={28} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Search failed</Text>
            <Text style={styles.emptyText}>Check your connection and try again</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.subjectId}
            renderItem={({ item, index }) => <SearchResultItem item={item} index={index} />}
            contentContainerStyle={[
              styles.resultsList,
              { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 },
            ]}
            ListHeaderComponent={
              results.length > 0 ? (
                <Text style={styles.resultsCount}>{results.length} results</Text>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Feather name="search" size={28} color={COLORS.textMuted} />
                </View>
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
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches} hitSlop={8}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
                {recentSearches.map((s) => (
                  <Pressable
                    key={s}
                    style={styles.recentChip}
                    onPress={() => {
                      setQuery(s);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Feather name="clock" size={13} color={COLORS.textMuted} />
                    <Text style={styles.recentChipText}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse by Genre</Text>
            <View style={styles.genreGrid}>
              {GENRE_CATEGORIES.map((genre) => (
                <GenreCard
                  key={genre.name}
                  genre={genre}
                  onPress={() => handleGenrePress(genre.name)}
                />
              ))}
            </View>
          </View>

          {trendingItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trending Now</Text>
                <Ionicons name="trending-up" size={18} color={COLORS.primary} />
              </View>
              {trendingItems.map((item, idx) => (
                <TrendingItem key={item.subjectId} item={item} rank={idx + 1} />
              ))}
            </View>
          )}
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
  headerSection: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchBarFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundElevated,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  searchingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  section: {
    paddingHorizontal: 18,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  clearText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  recentRow: {
    gap: 8,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  genreCard: {
    width: GENRE_CARD_WIDTH,
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
  },
  genreCardGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  genreCardText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  trendingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  trendingRank: {
    color: COLORS.textMuted,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    width: 28,
    textAlign: "center",
  },
  trendingPoster: {
    width: 50,
    height: 70,
    borderRadius: 6,
    backgroundColor: COLORS.backgroundCard,
  },
  trendingInfo: {
    flex: 1,
    gap: 4,
  },
  trendingTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  trendingGenre: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  resultsList: {
    paddingTop: 4,
    paddingHorizontal: 18,
  },
  resultsCount: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultPosterWrap: {
    position: "relative",
  },
  resultPoster: {
    width: 90,
    height: 130,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundCard,
  },
  resultTypeBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultTypeBadgeText: {
    color: COLORS.text,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  resultInfo: {
    flex: 1,
    gap: 6,
    paddingTop: 4,
  },
  resultTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultMetaText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },
  resultGenres: {
    flexDirection: "row",
    gap: 6,
  },
  genreChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genreChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    color: COLORS.accentGold,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  ratingLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
