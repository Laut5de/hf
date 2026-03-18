import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { COLORS } from "@/constants/colors";
import { ApiSubject, getGenres } from "@/data/api";

interface ApiMediaCardProps {
  item: ApiSubject;
  width?: number;
  height?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ApiMediaCard({
  item,
  width = 130,
  height = 190,
}: ApiMediaCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    router.push({ pathname: "/detail/[id]", params: { id: item.subjectId } });
  };

  const isSeries = item.subjectType === 2;

  return (
    <AnimatedPressable
      style={[animStyle, { width, height }]}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={handlePress}
    >
      <View style={[styles.card, { width, height }]}>
        <Image
          source={{ uri: item.cover?.url }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          placeholder={item.cover?.blurHash ? { blurhash: item.cover.blurHash } : undefined}
          cachePolicy="memory-disk"
          recyclingKey={item.subjectId}
        />
        <LinearGradient
          colors={["transparent", "rgba(10,10,15,0.9)"]}
          style={styles.gradient}
        />
        {item.imdbRatingValue && parseFloat(item.imdbRatingValue) > 0 && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>
              ★ {parseFloat(item.imdbRatingValue).toFixed(1)}
            </Text>
          </View>
        )}
        {isSeries && (
          <View style={styles.typeBadge}>
            <Ionicons name="play-circle-outline" size={10} color={COLORS.textSecondary} />
            <Text style={styles.typeBadgeText}>Series</Text>
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: COLORS.backgroundCard,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  ratingBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingBadgeText: {
    color: COLORS.accentGold,
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  typeBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  titleContainer: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 14,
  },
});
