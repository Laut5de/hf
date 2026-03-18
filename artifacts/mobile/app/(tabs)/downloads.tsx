import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
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
  FadeOutLeft,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function DownloadsScreen() {
  const insets = useSafeAreaInsets();
  const { downloads, removeDownload } = useApp();
  const [editMode, setEditMode] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleDelete = (id: string, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Remove Download", `Remove "${title}" from downloads?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeDownload(id),
      },
    ]);
  };

  const completed = downloads.filter((d) => d.downloadProgress === 1);
  const inProgress = downloads.filter(
    (d) => d.downloadProgress !== undefined && d.downloadProgress < 1
  );

  const totalSize = completed.length * 1.2; // mock GB

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Downloads</Text>
          <Text style={styles.headerSub}>
            {completed.length} titles • {totalSize.toFixed(1)} GB used
          </Text>
        </View>
        <Pressable
          style={styles.editBtn}
          onPress={() => setEditMode((e) => !e)}
        >
          <Text style={[styles.editText, editMode && { color: COLORS.primary }]}>
            {editMode ? "Done" : "Edit"}
          </Text>
        </Pressable>
      </View>

      {/* Storage Bar */}
      <View style={styles.storageContainer}>
        <View style={styles.storageBar}>
          <View style={[styles.storageFill, { width: `${(totalSize / 16) * 100}%` }]} />
        </View>
        <View style={styles.storageLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>JMH STREAM {totalSize.toFixed(1)} GB</Text>
          </View>
          <Text style={styles.storageAvail}>16 GB total</Text>
        </View>
      </View>

      {downloads.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="download-cloud" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Downloads</Text>
          <Text style={styles.emptyText}>
            Download titles to watch them offline
          </Text>
          <Pressable
            style={styles.findBtn}
            onPress={() => router.push("/(tabs)/search")}
          >
            <Text style={styles.findBtnText}>Find Something to Watch</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            inProgress.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Downloading</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isInProgress =
              item.downloadProgress !== undefined && item.downloadProgress < 1;

            return (
              <Animated.View
                exiting={FadeOutLeft}
                layout={Layout.springify()}
                style={styles.downloadItem}
              >
                <Pressable
                  style={styles.downloadPressable}
                  onPress={() => {
                    if (!editMode && !isInProgress) {
                      router.push({
                        pathname: "/detail/[id]",
                        params: { id: item.id },
                      });
                    }
                  }}
                >
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.thumbnail}
                    contentFit="cover"
                    transition={300}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {item.year} • {item.rating}
                      {item.type === "series"
                        ? ` • ${item.seasons?.length} Seasons`
                        : ` • ${item.duration}`}
                    </Text>
                    {isInProgress ? (
                      <View style={styles.progressContainer}>
                        <View style={styles.downloadProgressBar}>
                          <View
                            style={[
                              styles.downloadProgressFill,
                              {
                                width: `${(item.downloadProgress ?? 0) * 100}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {Math.round((item.downloadProgress ?? 0) * 100)}%
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.readyRow}>
                        <Feather
                          name="check-circle"
                          size={12}
                          color={COLORS.success}
                        />
                        <Text style={styles.readyText}>Ready to watch</Text>
                      </View>
                    )}
                  </View>

                  {editMode ? (
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item.id, item.title)}
                    >
                      <Feather name="trash-2" size={18} color={COLORS.error} />
                    </Pressable>
                  ) : isInProgress ? (
                    <Pressable style={styles.pauseBtn}>
                      <Ionicons
                        name="pause-circle"
                        size={28}
                        color={COLORS.primary}
                      />
                    </Pressable>
                  ) : (
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={COLORS.textMuted}
                    />
                  )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
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
    marginTop: 2,
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  storageContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  storageBar: {
    height: 6,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  storageFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  storageLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  storageAvail: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 80,
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
  findBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  findBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  downloadItem: {
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  downloadPressable: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    backgroundColor: COLORS.backgroundCard,
  },
  thumbnail: {
    width: 85,
    height: 60,
    borderRadius: 6,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  itemMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  downloadProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: "hidden",
  },
  downloadProgressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  readyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readyText: {
    color: COLORS.success,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
