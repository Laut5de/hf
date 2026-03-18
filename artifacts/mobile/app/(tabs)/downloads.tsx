import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutLeft,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { getGenres, getYear } from "@/data/api";

export default function MyListScreen() {
  const insets = useSafeAreaInsets();
  const { myList, removeFromMyList } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleRemove = (subjectId: string, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Remove from My List", `Remove "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeFromMyList(subjectId),
      },
    ]);
  };

  const validItems = myList.filter((item) => item.title && item.title.length > 0);

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My List</Text>
        <Text style={styles.headerSub}>
          {validItems.length} {validItems.length === 1 ? "title" : "titles"} saved
        </Text>
      </View>

      {validItems.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="bookmark-outline" size={36} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptyText}>
            Add movies and series to your list to watch them later
          </Text>
          <Pressable
            style={styles.browseBtn}
            onPress={() => router.push("/(tabs)/search")}
          >
            <Text style={styles.browseBtnText}>Browse Content</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={validItems}
          keyExtractor={(item) => item.subjectId}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const genres = getGenres(item.genre);
            const year = getYear(item.releaseDate);
            const isSeries = item.subjectType === 2;
            const rating = item.imdbRatingValue ? parseFloat(item.imdbRatingValue) : 0;

            return (
              <Animated.View
                entering={FadeInDown.delay(index * 60).springify()}
                exiting={FadeOutLeft}
                layout={Layout.springify()}
              >
                <Pressable
                  style={styles.listItem}
                  onPress={() =>
                    router.push({
                      pathname: "/detail/[id]",
                      params: { id: item.subjectId },
                    })
                  }
                >
                  <View style={styles.posterWrap}>
                    <Image
                      source={{ uri: item.cover.url }}
                      style={styles.poster}
                      contentFit="cover"
                      transition={200}
                      placeholder={item.cover.blurHash ? { blurhash: item.cover.blurHash } : undefined}
                    />
                    {isSeries && (
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>Series</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.metaRow}>
                      {year ? <Text style={styles.metaText}>{year}</Text> : null}
                      {item.countryName ? (
                        <>
                          <View style={styles.dot} />
                          <Text style={styles.metaText}>{item.countryName}</Text>
                        </>
                      ) : null}
                    </View>
                    {genres.length > 0 && (
                      <View style={styles.genreRow}>
                        {genres.slice(0, 2).map((g) => (
                          <View key={g} style={styles.genreChip}>
                            <Text style={styles.genreChipText}>{g}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {rating > 0 && (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={11} color={COLORS.accentGold} />
                        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => handleRemove(item.subjectId, item.title)}
                    hitSlop={10}
                  >
                    <Feather name="x" size={18} color={COLORS.textMuted} />
                  </Pressable>
                </Pressable>
              </Animated.View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 80,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.backgroundCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  posterWrap: {
    position: "relative",
  },
  poster: {
    width: 85,
    height: 125,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundCard,
  },
  typeBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  typeBadgeText: {
    color: COLORS.text,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  info: {
    flex: 1,
    gap: 5,
    paddingTop: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },
  genreRow: {
    flexDirection: "row",
    gap: 6,
  },
  genreChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
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
  },
  ratingText: {
    color: COLORS.accentGold,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
});
