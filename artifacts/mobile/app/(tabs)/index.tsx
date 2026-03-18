import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeroBanner } from "@/components/HeroBanner";
import { MediaRow } from "@/components/MediaRow";
import { COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import {
  ALL_MEDIA,
  CATEGORIES,
  CONTINUE_WATCHING,
  FEATURED_MEDIA,
} from "@/data/mockData";

const HEADER_SCROLL_THRESHOLD = 80;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { watchlist } = useApp();
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const [activeGenre, setActiveGenre] = useState("All");

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const genres = ["All", "Series", "Movies", "Sci-Fi", "Thriller", "Action"];

  const watchlistMedia = ALL_MEDIA.filter((m) => watchlist.includes(m.id));

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    items: activeGenre === "All"
      ? cat.items
      : activeGenre === "Series"
      ? cat.items.filter((i) => i.type === "series")
      : activeGenre === "Movies"
      ? cat.items.filter((i) => i.type === "movie")
      : cat.items.filter((i) => i.genre.includes(activeGenre)),
  })).filter((cat) => cat.items.length > 0);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      {/* Animated solid header */}
      <RNAnimated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topInset,
            backgroundColor: COLORS.background,
            opacity: headerOpacity,
            pointerEvents: "none",
          },
        ]}
      />

      {/* Fixed top bar */}
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <Text style={styles.logo}>STREAMX</Text>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => router.push("/(tabs)/search")}
          >
            <Ionicons name="search" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <RNAnimated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 }}
      >
        <HeroBanner items={FEATURED_MEDIA} topInset={topInset} />

        {/* Genre Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genrePills}
          style={styles.genreScroll}
        >
          {genres.map((g) => (
            <Pressable
              key={g}
              style={[styles.pill, activeGenre === g && styles.pillActive]}
              onPress={() => setActiveGenre(g)}
            >
              <Text
                style={[
                  styles.pillText,
                  activeGenre === g && styles.pillTextActive,
                ]}
              >
                {g}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Continue Watching */}
        {CONTINUE_WATCHING.length > 0 && (
          <MediaRow
            title="Continue Watching"
            items={CONTINUE_WATCHING}
            showProgress
          />
        )}

        {/* My List */}
        {watchlistMedia.length > 0 && (
          <MediaRow title="My List" items={watchlistMedia} />
        )}

        {/* Category Rows */}
        {filteredCategories.map((cat) => (
          <MediaRow key={cat.id} title={cat.title} items={cat.items} />
        ))}
      </RNAnimated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 10,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  logo: {
    color: COLORS.primary,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  topBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBtn: {},
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  scroll: {
    flex: 1,
  },
  genreScroll: {
    marginBottom: 20,
  },
  genrePills: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  pillTextActive: {
    color: COLORS.text,
    fontFamily: "Inter_700Bold",
  },
});
