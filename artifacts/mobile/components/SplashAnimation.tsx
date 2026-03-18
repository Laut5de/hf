import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "@/constants/colors";

interface SplashAnimationProps {
  onFinish: () => void;
}

export function SplashAnimation({ onFinish }: SplashAnimationProps) {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSequence(
      withTiming(1.15, { duration: 500, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 300 })
    );

    glowOpacity.value = withDelay(
      400,
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.4, { duration: 600 })
      )
    );

    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));

    const exitTimer = setTimeout(() => {
      onFinishRef.current();
    }, 2600);

    return () => clearTimeout(exitTimer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A0A0F", "#12101A", "#0A0A0F"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.glowCircle, glowStyle]} />

      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Text style={styles.logoJMH}>JMH</Text>
        <Text style={styles.logoStream}> STREAM</Text>
      </Animated.View>

      <Animated.View style={taglineStyle}>
        <Text style={styles.tagline}>Watch Anywhere. Anytime.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    zIndex: 999,
  },
  glowCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 20,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  logoJMH: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    color: COLORS.primary,
    letterSpacing: 2,
  },
  logoStream: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
    letterSpacing: 6,
  },
  tagline: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});
