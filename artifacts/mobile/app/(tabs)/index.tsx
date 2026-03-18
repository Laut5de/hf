import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiBanner } from "@/components/ApiBanner";
import { ApiMediaRow } from "@/components/ApiMediaRow";
import { COLORS } from "@/constants/colors";
import { fetchHomepage } from "@/data/api";

const HEADER_SCROLL_THRESHOLD = 80;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["homepage"],
    queryFn: fetchHomepage,
    staleTime: 5 * 60 * 1000,
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const operatingList = data?.operatingList || [];
  const bannerOp = operatingList.find((op) => op.type === "BANNER" && op.banner?.items?.length);
  const bannerItems = bannerOp?.banner?.items?.slice(0, 8) || [];
  const subjectRows = operatingList.filter(
    (op) => op.type === "SUBJECTS_MOVIE" && op.subjects.length > 0
  );

  return (
    <View style={styles.container}>
      <RNAnimated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topInset,
            backgroundColor: COLORS.background,
            opacity: headerOpacity,
            pointerEvents: "none" as const,
          },
        ]}
      />

      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <Text style={styles.logo}>JMH STREAM</Text>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => router.push("/(tabs)/search")}
          >
            <Ionicons name="search" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
        </View>
      </View>

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
          {bannerItems.length > 0 && (
            <ApiBanner items={bannerItems} topInset={topInset} />
          )}

          {subjectRows.map((row, index) => (
            <ApiMediaRow
              key={`${row.title}-${index}`}
              title={row.title}
              items={row.subjects}
            />
          ))}
        </RNAnimated.ScrollView>
      )}
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
