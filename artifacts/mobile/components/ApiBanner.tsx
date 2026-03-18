import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { COLORS } from "@/constants/colors";
import { ApiBannerItem, getGenres, getYear } from "@/data/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = 500;

interface ApiBannerProps {
  items: ApiBannerItem[];
  topInset: number;
}

function HeroItem({ item, topInset }: { item: ApiBannerItem; topInset: number }) {
  const scale = useSharedValue(1);
  const subject = item.subject;

  const playAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/player",
      params: { id: item.subjectId, title: item.title },
    });
  };

  const handleDetail = () => {
    router.push({ pathname: "/detail/[id]", params: { id: item.subjectId } });
  };

  const genres = subject ? getGenres(subject.genre) : [];
  const year = subject ? getYear(subject.releaseDate) : "";
  const rating = subject?.imdbRatingValue;

  return (
    <Pressable
      style={[styles.heroItem, { width: SCREEN_WIDTH }]}
      onPress={handleDetail}
    >
      <Image
        source={{ uri: item.image?.url }}
        style={styles.heroImage}
        contentFit="cover"
        transition={600}
        placeholder={item.image?.blurHash ? { blurhash: item.image.blurHash } : undefined}
      />
      <LinearGradient
        colors={["transparent", "rgba(10,10,15,0.4)", COLORS.background]}
        style={styles.heroGradient}
        locations={[0, 0.45, 1]}
      />
      <LinearGradient
        colors={["rgba(10,10,15,0.5)", "transparent"]}
        style={styles.topGradient}
      />

      <View style={[styles.heroContent, { paddingTop: topInset + 60 }]}>
        <View style={styles.heroMeta}>
          {rating && parseFloat(rating) > 0 && (
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={11} color={COLORS.accentGold} />
              <Text style={styles.ratingPillText}>{parseFloat(rating).toFixed(1)}</Text>
            </View>
          )}
          {year ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{year}</Text>
            </View>
          ) : null}
          {subject?.subjectType === 2 ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>Series</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>

        <View style={styles.genreRow}>
          {genres.slice(0, 3).map((g, i) => (
            <React.Fragment key={g}>
              {i > 0 && <Text style={styles.dotChar}>·</Text>}
              <Text style={styles.genreText}>{g}</Text>
            </React.Fragment>
          ))}
        </View>

        <Animated.View style={playAnim}>
          <Pressable
            style={styles.playBtn}
            onPressIn={() => { scale.value = withSpring(0.95); }}
            onPressOut={() => { scale.value = withSpring(1); }}
            onPress={handlePlay}
          >
            <Ionicons name="play" size={20} color="#000" />
            <Text style={styles.playBtnText}>Play Now</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Pressable>
  );
}

export function ApiBanner({ items, topInset }: ApiBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % items.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeIndex, items.length]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <HeroItem item={item} topInset={topInset} />}
        keyExtractor={(_, i) => i.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    marginBottom: 16,
  },
  heroItem: {
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.8,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245,166,35,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.3)",
  },
  ratingPillText: {
    color: COLORS.accentGold,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  metaPill: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaPillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    marginBottom: 6,
  },
  genreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 18,
  },
  genreText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  dotChar: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  playBtnText: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
