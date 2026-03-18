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
import { Media } from "@/data/mockData";

interface MediaCardProps {
  item: Media;
  width?: number;
  height?: number;
  showProgress?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MediaCard({
  item,
  width = 130,
  height = 190,
  showProgress = false,
}: MediaCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    router.push({ pathname: "/detail/[id]", params: { id: item.id } });
  };

  return (
    <AnimatedPressable
      style={[animStyle, { width, height }]}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={handlePress}
    >
      <View style={[styles.card, { width, height }]}>
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={["transparent", "rgba(10,10,15,0.9)"]}
          style={styles.gradient}
        />
        {item.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
        {item.type === "series" && (
          <View style={styles.typeBadge}>
            <Ionicons name="play-circle-outline" size={10} color={COLORS.textSecondary} />
            <Text style={styles.typeBadgeText}>Series</Text>
          </View>
        )}
        {showProgress && item.watchProgress !== undefined && item.watchProgress > 0 && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${item.watchProgress * 100}%` },
              ]}
            />
          </View>
        )}
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
    height: "50%",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily: "Inter_700Bold",
  },
  typeBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  typeBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
