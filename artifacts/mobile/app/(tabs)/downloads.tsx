import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useDownloads } from "@/context/DownloadContext";
import type { DownloadedItem, ActiveDownload } from "@/context/DownloadContext";
import { getGenres, getYear } from "@/data/api";

type TabMode = "mylist" | "downloads";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDuration(minutes: number): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function MyListScreen() {
  const insets = useSafeAreaInsets();
  const { myList, removeFromMyList } = useApp();
  const {
    downloads,
    activeDownloads,
    removeDownload,
    cancelDownload,
    shareDownload,
    totalStorageUsed,
  } = useDownloads();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const [tab, setTab] = useState<TabMode>("mylist");

  const handleRemoveFromList = (subjectId: string, title: string) => {
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

  const handleRemoveDownload = (subjectId: string, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Download", `Delete "${title}" from device?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeDownload(subjectId),
      },
    ]);
  };

  const handlePlayDownloaded = (item: DownloadedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/player",
      params: {
        id: item.subjectId,
        title: item.title,
        localPath: item.filePath,
      },
    });
  };

  const validItems = myList.filter((item) => item.title && item.title.length > 0);

  const renderMyListItem = ({ item, index }: { item: typeof validItems[0]; index: number }) => {
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
              cachePolicy="memory-disk"
              recyclingKey={`mylist-${item.subjectId}`}
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
            onPress={() => handleRemoveFromList(item.subjectId, item.title)}
            hitSlop={10}
          >
            <Feather name="x" size={18} color={COLORS.textMuted} />
          </Pressable>
        </Pressable>
      </Animated.View>
    );
  };

  const renderActiveDownload = (item: ActiveDownload, index: number) => (
    <Animated.View
      key={item.subjectId}
      entering={FadeInDown.delay(index * 60).springify()}
      style={styles.downloadItem}
    >
      <View style={styles.downloadItemLeft}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <View style={styles.downloadItemInfo}>
          <Text style={styles.downloadTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${Math.round(item.progress * 100)}%` }]}
            />
          </View>
          <Text style={styles.downloadMeta}>
            {Math.round(item.progress * 100)}% · {formatBytes(item.downloadedBytes)} / {formatBytes(item.totalBytes)}
          </Text>
        </View>
      </View>
      <Pressable
        style={styles.cancelBtn}
        onPress={() => cancelDownload(item.subjectId)}
        hitSlop={10}
      >
        <Feather name="x" size={16} color={COLORS.textMuted} />
      </Pressable>
    </Animated.View>
  );

  const renderDownloadedItem = ({ item, index }: { item: DownloadedItem; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      exiting={FadeOutLeft}
      layout={Layout.springify()}
    >
      <Pressable
        style={styles.listItem}
        onPress={() => handlePlayDownloaded(item)}
      >
        <View style={styles.posterWrap}>
          <Image
            source={{ uri: item.coverUrl }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
            placeholder={item.coverBlurHash ? { blurhash: item.coverBlurHash } : undefined}
            cachePolicy="memory-disk"
            recyclingKey={`dl-${item.subjectId}`}
          />
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityBadgeText}>{item.quality}p</Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formatBytes(item.fileSize)}</Text>
            {item.duration > 0 && (
              <>
                <View style={styles.dot} />
                <Text style={styles.metaText}>{formatDuration(item.duration)}</Text>
              </>
            )}
          </View>
          {item.genre ? (
            <View style={styles.genreRow}>
              {getGenres(item.genre).slice(0, 2).map((g) => (
                <View key={g} style={styles.genreChip}>
                  <Text style={styles.genreChipText}>{g}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <View style={styles.dlActions}>
          <Pressable
            style={styles.dlActionBtn}
            onPress={() => shareDownload(item.subjectId)}
            hitSlop={8}
          >
            <Feather name="share-2" size={15} color={COLORS.textSecondary} />
          </Pressable>
          <Pressable
            style={styles.dlActionBtn}
            onPress={() => handleRemoveDownload(item.subjectId, item.title)}
            hitSlop={8}
          >
            <Feather name="trash-2" size={15} color={COLORS.primary} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabBtn, tab === "mylist" && styles.tabBtnActive]}
          onPress={() => setTab("mylist")}
        >
          <Ionicons
            name="bookmark"
            size={14}
            color={tab === "mylist" ? COLORS.text : COLORS.textMuted}
          />
          <Text style={[styles.tabBtnText, tab === "mylist" && styles.tabBtnTextActive]}>
            My List ({validItems.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === "downloads" && styles.tabBtnActive]}
          onPress={() => setTab("downloads")}
        >
          <Feather
            name="download"
            size={14}
            color={tab === "downloads" ? COLORS.text : COLORS.textMuted}
          />
          <Text style={[styles.tabBtnText, tab === "downloads" && styles.tabBtnTextActive]}>
            Downloads ({downloads.length})
          </Text>
        </Pressable>
      </View>

      {tab === "mylist" ? (
        validItems.length === 0 ? (
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
            renderItem={renderMyListItem}
          />
        )
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.subjectId}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {activeDownloads.length > 0 && (
                <View style={styles.activeSection}>
                  <Text style={styles.sectionLabel}>Downloading</Text>
                  {activeDownloads.map((d, i) => renderActiveDownload(d, i))}
                </View>
              )}
              {downloads.length > 0 && (
                <View style={styles.storageRow}>
                  <Feather name="hard-drive" size={14} color={COLORS.textMuted} />
                  <Text style={styles.storageText}>
                    {formatBytes(totalStorageUsed)} used on device
                  </Text>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            activeDownloads.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Feather name="download" size={36} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>No downloads</Text>
                <Text style={styles.emptyText}>
                  Download movies and shows to watch them offline
                </Text>
                <Pressable
                  style={styles.browseBtn}
                  onPress={() => router.push("/(tabs)/search")}
                >
                  <Text style={styles.browseBtnText}>Browse Content</Text>
                </Pressable>
              </View>
            ) : null
          }
          renderItem={renderDownloadedItem}
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
    paddingBottom: 12,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabBtnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  tabBtnTextActive: {
    color: COLORS.text,
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
  qualityBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: COLORS.accentGold,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  qualityBadgeText: {
    color: "#000",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
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
  activeSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  downloadItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  downloadItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  downloadItemInfo: {
    flex: 1,
    gap: 4,
  },
  downloadTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  downloadMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  progressBarBg: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  cancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  storageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    marginBottom: 4,
  },
  storageText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  dlActions: {
    gap: 8,
    alignItems: "center",
    paddingTop: 4,
  },
  dlActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
});
