import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiBanner } from "@/components/ApiBanner";
import { ApiMediaRow } from "@/components/ApiMediaRow";
import { AppHeader } from "@/components/AppHeader";
import { COLORS } from "@/constants/colors";
import { fetchHomepage } from "@/data/api";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const CATEGORY_FILTERS = ["All", "Movies", "Series", "Anime", "K-Drama", "Action"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [activeFilter, setActiveFilter] = useState("All");

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["homepage"],
    queryFn: fetchHomepage,
    staleTime: 5 * 60 * 1000,
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const operatingList = data?.operatingList || [];
  const bannerOp = operatingList.find((op) => op.type === "BANNER" && op.banner?.items?.length);
  const bannerItems = bannerOp?.banner?.items?.slice(0, 6) || [];
  const subjectRows = operatingList.filter(
    (op) => op.type === "SUBJECTS_MOVIE" && op.subjects.length > 0
  );

  const filteredRows = activeFilter === "All"
    ? subjectRows
    : subjectRows.filter((row) => {
        const t = row.title.toLowerCase();
        const f = activeFilter.toLowerCase();
        if (f === "movies") return t.includes("movie");
        if (f === "series") return t.includes("series") || t.includes("drama") || t.includes("shows");
        if (f === "anime") return t.includes("anime");
        if (f === "k-drama") return t.includes("k-drama");
        if (f === "action") return t.includes("action");
        return true;
      });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <View style={styles.container}>
      <AppHeader scrollY={scrollY} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.errorTitle}>Failed to load</Text>
          <Text style={styles.errorText}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <AnimatedScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
              progressBackgroundColor={COLORS.backgroundCard}
            />
          }
        >
          {bannerItems.length > 0 && (
            <ApiBanner items={bannerItems} topInset={topInset} />
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {CATEGORY_FILTERS.map((filter) => (
              <Pressable
                key={filter}
                style={[
                  styles.filterChip,
                  activeFilter === filter && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === filter && styles.filterChipTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {filteredRows.length > 0 ? (
            filteredRows.map((row, index) => (
              <ApiMediaRow
                key={`${row.title}-${index}`}
                title={row.title}
                items={row.subjects}
              />
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No content found for "{activeFilter}"
              </Text>
              <Pressable onPress={() => setActiveFilter("All")}>
                <Text style={styles.resetFilter}>Show All</Text>
              </Pressable>
            </View>
          )}
        </AnimatedScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  filterChipTextActive: {
    color: COLORS.text,
    fontFamily: "Inter_700Bold",
  },
  noResultsContainer: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
  },
  noResultsText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  resetFilter: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
