import { Feather, Ionicons } from "@expo/vector-icons";
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
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { ApiBannerItem, getGenres, getYear } from "@/data/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = 520;

interface ApiBannerProps {
  items: ApiBannerItem[];
  topInset: number;
}

function HeroItem({ item, topInset }: { item: ApiBannerItem; topInset: number }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useApp();
  const inWatchlist = isInWatchlist(item.subjectId);
  const scale = useSharedValue(1);
  const subject = item.subject;

  const playAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/detail/[id]", params: { id: item.subjectId } });
  };

  const handleWatchlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (inWatchlist) {
      removeFromWatchlist(item.subjectId);
    } else {
      addToWatchlist(item.subjectId);
    }
  };

  const genres = subject ? getGenres(subject.genre) : [];
  const year = subject ? getYear(subject.releaseDate) : "";
  const rating = subject?.imdbRatingValue;

  return (
    <View style={[styles.heroItem, { width: SCREEN_WIDTH }]}>
      <Image
        source={{ uri: item.image?.url }}
        style={styles.heroImage}
        contentFit="cover"
        transition={600}
        placeholder={item.image?.blurHash ? { blurhash: item.image.blurHash } : undefined}
      />
      <LinearGradient
        colors={["rgba(10,10,15,0.1)", "rgba(10,10,15,0.5)", COLORS.background]}
        style={styles.heroGradient}
        locations={[0, 0.5, 1]}
      />
      <LinearGradient
        colors={["rgba(10,10,15,0.6)", "transparent"]}
        style={styles.topGradient}
      />

      <View style={[styles.heroContent, { paddingTop: topInset + 60 }]}>
        <View style={styles.heroMeta}>
          {rating && parseFloat(rating) > 0 && (
            <Text style={styles.matchText}>★ {parseFloat(rating).toFixed(1)} IMDb</Text>
          )}
          {year ? <Text style={styles.metaText}>{year}</Text> : null}
          {subject?.countryName ? <Text style={styles.metaText}>{subject.countryName}</Text> : null}
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

        <View style={styles.heroActions}>
          <Animated.View style={playAnim}>
            <Pressable
              style={styles.playBtn}
              onPressIn={() => { scale.value = withSpring(0.95); }}
              onPressOut={() => { scale.value = withSpring(1); }}
              onPress={handlePlay}
            >
              <Ionicons name="play" size={18} color="#000" />
              <Text style={styles.playBtnText}>Play</Text>
            </Pressable>
          </Animated.View>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleWatchlist}>
            <Ionicons
              name={inWatchlist ? "checkmark" : "add"}
              size={20}
              color={COLORS.text}
            />
            <Text style={styles.secondaryBtnText}>
              {inWatchlist ? "Saved" : "My List"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoBtn}
            onPress={handlePlay}
          >
            <Feather name="info" size={18} color={COLORS.text} />
            <Text style={styles.secondaryBtnText}>Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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

      <View style={styles.dots}>
        {items.slice(0, 8).map((_, i) => (
          <View
            key={i}
            style={[styles.dot2, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    marginBottom: 8,
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
    height: HERO_HEIGHT * 0.75,
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
    paddingBottom: 36,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  matchText: {
    color: COLORS.accentGold,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    marginBottom: 8,
  },
  genreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
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
  heroActions: {
    flexDirection: "row",
    gap: 10,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.text,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  playBtnText: {
    color: "#000",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  infoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  dots: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
  },
  dot2: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 16,
  },
});
