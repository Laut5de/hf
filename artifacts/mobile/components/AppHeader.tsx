import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";

interface AppHeaderProps {
  scrollY?: SharedValue<number>;
  transparent?: boolean;
  title?: string;
  showSearch?: boolean;
  showNotification?: boolean;
}

export function AppHeader({
  scrollY,
  transparent = false,
  title,
  showSearch = true,
  showNotification = true,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 20 : insets.top;

  const bgStyle = useAnimatedStyle(() => {
    if (!scrollY || transparent) return { opacity: 0 };
    return {
      opacity: interpolate(scrollY.value, [0, 100], [0, 1], "clamp"),
    };
  });

  return (
    <View style={[styles.wrapper, { paddingTop: topInset }]} pointerEvents="box-none">
      <Animated.View style={[styles.bgFill, bgStyle]}>
        <LinearGradient
          colors={[COLORS.background, "rgba(10,10,15,0.95)", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.content} pointerEvents="box-none">
        <View style={styles.left}>
          <Text style={styles.logo}>
            {title || "JMH"}
            {!title && <Text style={styles.logoAccent}> STREAM</Text>}
          </Text>
        </View>

        <View style={styles.right}>
          {showSearch && (
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push("/(tabs)/search")}
              hitSlop={8}
            >
              <Feather name="search" size={20} color={COLORS.text} />
            </Pressable>
          )}
          {showNotification && (
            <Pressable style={styles.iconBtn} hitSlop={8}>
              <Ionicons name="notifications-outline" size={21} color={COLORS.text} />
              <View style={styles.notifDot} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  bgFill: {
    ...StyleSheet.absoluteFillObject,
    height: 120,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    color: COLORS.primary,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  logoAccent: {
    color: COLORS.text,
    letterSpacing: 3,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
});
