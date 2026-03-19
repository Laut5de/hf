import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ResizeMode, Video } from "expo-av";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useDownloads } from "@/context/DownloadContext";
import {
  ApiSubject,
  cleanFrenchTitle,
  fetchFrenchVersion,
  fetchInfo,
  fetchSearch,
  formatDuration,
  getGenres,
  getYear,
  isFrenchVersion,
} from "@/data/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BACKDROP_HEIGHT = 320;

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isInMyList, addToMyList, removeFromMyList } = useApp();
  const { isDownloaded, isDownloading, isPaused, getDownloadProgress, startDownload, pauseDownload, resumeDownload, cancelDownload } = useDownloads();
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
  const [trailerPlaying, setTrailerPlaying] = useState(false);
  const [trailerMuted, setTrailerMuted] = useState(true);
  const trailerRef = useRef<Video>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const inMyList = isInMyList(id as string);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["info", id],
    queryFn: () => fetchInfo(id as string),
    enabled: !!id,
  });

  const currentTitle = (apiData as any)?.subject?.title || (apiData as any)?.title || "";
  const isCurrentFrench = isFrenchVersion(currentTitle);

  const { data: altLangData } = useQuery({
    queryKey: ["alt-lang", id, currentTitle],
    queryFn: async () => {
      if (!currentTitle) return null;
      try {
        if (isCurrentFrench) {
          const cleanTitle = cleanFrenchTitle(currentTitle);
          const results = await fetchSearch(cleanTitle);
          const match = results.find(
            (item) =>
              !isFrenchVersion(item.title) &&
              item.title.toLowerCase().includes(cleanTitle.toLowerCase().split(":")[0].trim()) &&
              item.subjectId !== id
          );
          return match || null;
        } else {
          return fetchFrenchVersion(currentTitle);
        }
      } catch {
        return null;
      }
    },
    enabled: !!currentTitle && currentTitle.length > 0,
  });

  const handleTrailerToggle = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (trailerPlaying) {
        await trailerRef.current?.pauseAsync();
        setTrailerPlaying(false);
      } else {
        await trailerRef.current?.playAsync();
        setTrailerPlaying(true);
      }
    } catch {}
  }, [trailerPlaying]);

  const handleTrailerMute = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTrailerMuted((m) => !m);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!apiData) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Content not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const subject = (apiData as any).subject || apiData;
  const stars = (apiData as any).stars || [];
  const resource = (apiData as any).resource || {};
  const resourceSeasons = resource.seasons || [];

  const rawTitle = subject.title || "";
  const title = isCurrentFrench ? cleanFrenchTitle(rawTitle) : rawTitle;
  const coverUrl = subject.cover?.url || "";
  const coverBlur = subject.cover?.blurHash || "";
  const stillsUrl = subject.stills?.url || subject.trailer?.cover?.url || coverUrl;
  const descriptionText = subject.description || "";
  const genres = getGenres(subject.genre || "");
  const year = getYear(subject.releaseDate || "");
  const rating = subject.imdbRatingValue;
  const country = subject.countryName || "";
  const isSeries = subject.subjectType === 2;
  const duration = formatDuration(subject.duration || 0);

  const trailerUrl = subject.trailer?.videoAddress?.url || "";
  const trailerCoverUrl = subject.trailer?.cover?.url || "";
  const trailerDuration = subject.trailer?.videoAddress?.duration || 0;

  const handleMyList = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (inMyList) {
      removeFromMyList(id as string);
    } else {
      const apiSubject: ApiSubject = {
        subjectId: subject.subjectId || id as string,
        subjectType: subject.subjectType || 1,
        title: subject.title || "",
        description: subject.description || "",
        releaseDate: subject.releaseDate || "",
        duration: subject.duration || 0,
        genre: subject.genre || "",
        cover: subject.cover || { url: "", width: 0, height: 0 },
        countryName: subject.countryName || "",
        imdbRatingValue: subject.imdbRatingValue || "",
        hasResource: subject.hasResource || false,
        detailPath: subject.detailPath || "",
        imdbRatingCount: subject.imdbRatingCount || 0,
        corner: subject.corner || "",
        postTitle: subject.postTitle || "",
      };
      addToMyList(apiSubject);
    }
  };

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/player",
      params: { id: id as string, title },
    });
  };

  const downloaded = isDownloaded(id as string);
  const downloading = isDownloading(id as string);
  const paused = isPaused(id as string);
  const dlProgress = getDownloadProgress(id as string);

  const handleDownload = () => {
    if (downloaded) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (paused) {
      resumeDownload(id as string);
    } else if (downloading) {
      pauseDownload(id as string);
    } else {
      startDownload({
        subjectId: id as string,
        title,
        coverUrl: subject.cover?.url || "",
        coverBlurHash: subject.cover?.blurHash,
        genre: subject.genre || "",
        duration: subject.duration || 0,
      });
    }
  };

  const handleSwitchLanguage = () => {
    if (!altLangData) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({
      pathname: "/detail/[id]",
      params: { id: altLangData.subjectId },
    });
  };

  const description =
    showFullDesc || descriptionText.length < 120
      ? descriptionText
      : descriptionText.slice(0, 120) + "...";

  const castNames = stars
    .filter((s: any) => s.staffType === 1)
    .slice(0, 6)
    .map((s: any) => s.name);
  const directorName = stars
    .filter((s: any) => s.staffType === 2)
    .map((s: any) => s.name);

  const seasonTitles: string[] = [];
  const seasonEpisodeCounts: number[] = [];
  if (isSeries && resourceSeasons.length > 0) {
    resourceSeasons.forEach((s: any) => {
      const seasonNum = s.se || 1;
      seasonTitles.push(`Season ${seasonNum}`);
      seasonEpisodeCounts.push(s.maxEp || s.allEp || 0);
    });
  }

  const currentEpisodeCount = seasonEpisodeCounts[selectedSeasonIdx] || 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
        }}
      >
        <View style={[styles.backdropContainer, { height: BACKDROP_HEIGHT + topInset }]}>
          <Image
            source={{ uri: stillsUrl }}
            style={styles.backdrop}
            contentFit="cover"
            transition={300}
            placeholder={coverBlur ? { blurhash: coverBlur } : undefined}
            cachePolicy="memory-disk"
            priority="high"
          />
          <LinearGradient
            colors={["transparent", COLORS.background]}
            style={styles.backdropGradient}
          />
          <LinearGradient
            colors={["rgba(10,10,15,0.7)", "transparent"]}
            style={styles.backdropTopGradient}
          />

          <Pressable
            style={[styles.backBtn, { top: topInset + 12 }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color={COLORS.text} />
          </Pressable>

          <Pressable style={[styles.moreBtn, { top: topInset + 12 }]}>
            <Feather name="more-horizontal" size={22} color={COLORS.text} />
          </Pressable>
        </View>

        <Animated.View entering={FadeIn.delay(200)} style={styles.content}>
          <Text style={styles.title}>{title}</Text>

          {altLangData && (
            <Animated.View entering={FadeIn.delay(250)} style={styles.langRow}>
              <View style={styles.langToggle}>
                <Pressable
                  style={[
                    styles.langOption,
                    !isCurrentFrench && styles.langOptionActive,
                  ]}
                  onPress={isCurrentFrench ? handleSwitchLanguage : undefined}
                >
                  <Text
                    style={[
                      styles.langOptionText,
                      !isCurrentFrench && styles.langOptionTextActive,
                    ]}
                  >
                    🇬🇧 English
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.langOption,
                    isCurrentFrench && styles.langOptionActive,
                  ]}
                  onPress={!isCurrentFrench ? handleSwitchLanguage : undefined}
                >
                  <Text
                    style={[
                      styles.langOptionText,
                      isCurrentFrench && styles.langOptionTextActive,
                    ]}
                  >
                    🇫🇷 Français
                  </Text>
                </Pressable>
              </View>
              {isCurrentFrench && (
                <View style={styles.langBadge}>
                  <Text style={styles.langBadgeText}>VF</Text>
                </View>
              )}
            </Animated.View>
          )}

          <View style={styles.metaRow}>
            {rating && parseFloat(rating) > 0 && (
              <View style={styles.scoreRow}>
                <Text style={styles.scoreStar}>★</Text>
                <Text style={styles.scoreValue}>{parseFloat(rating).toFixed(1)} IMDb</Text>
              </View>
            )}
            {year ? <Text style={styles.metaText}>{year}</Text> : null}
            {country ? <Text style={styles.metaText}>{country}</Text> : null}
            <Text style={styles.metaText}>
              {isSeries ? "Series" : duration || "Movie"}
            </Text>
          </View>

          <View style={styles.genreRow}>
            {genres.map((g) => (
              <View key={g} style={styles.genreTag}>
                <Text style={styles.genreTagText}>{g}</Text>
              </View>
            ))}
          </View>

          <Animated.View entering={SlideInDown.delay(300)} style={styles.actions}>
            <Pressable style={styles.playBtn} onPress={handlePlay}>
              <Ionicons name="play" size={20} color="#000" />
              <Text style={styles.playBtnText}>Play</Text>
            </Pressable>

            <Pressable
              style={[
                styles.downloadBtn,
                downloaded && { borderColor: COLORS.success },
                paused && { borderColor: COLORS.gold },
              ]}
              onPress={handleDownload}
            >
              {paused ? (
                <>
                  <Feather name="play" size={18} color={COLORS.gold} />
                  <Text style={[styles.downloadBtnText, { color: COLORS.gold }]}>
                    Resume {Math.round(dlProgress * 100)}%
                  </Text>
                </>
              ) : downloading ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.downloadBtnText}>
                    {Math.round(dlProgress * 100)}%
                  </Text>
                </>
              ) : downloaded ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={[styles.downloadBtnText, { color: COLORS.success }]}>
                    Downloaded
                  </Text>
                </>
              ) : (
                <>
                  <Feather name="download" size={18} color={COLORS.text} />
                  <Text style={styles.downloadBtnText}>Download</Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          <View style={styles.iconActions}>
            <TouchableOpacity style={styles.iconAction} onPress={handleMyList}>
              <Ionicons
                name={inMyList ? "checkmark-circle" : "add-circle-outline"}
                size={24}
                color={inMyList ? COLORS.success : COLORS.text}
              />
              <Text style={styles.iconActionText}>
                {inMyList ? "Saved" : "My List"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconAction}>
              <Feather name="share-2" size={22} color={COLORS.text} />
              <Text style={styles.iconActionText}>Share</Text>
            </TouchableOpacity>
          </View>

          {descriptionText.length > 0 && (
            <Pressable onPress={() => setShowFullDesc((s) => !s)}>
              <Text style={styles.description}>{description}</Text>
              {descriptionText.length > 120 && (
                <Text style={styles.moreText}>
                  {showFullDesc ? "Less" : "More"}
                </Text>
              )}
            </Pressable>
          )}

          {(castNames.length > 0 || directorName.length > 0) && (
            <View style={styles.castSection}>
              {castNames.length > 0 && (
                <View style={styles.castRow}>
                  <Text style={styles.castLabel}>Cast:</Text>
                  <Text style={styles.castValue} numberOfLines={2}>
                    {castNames.join(", ")}
                  </Text>
                </View>
              )}
              {directorName.length > 0 && (
                <View style={styles.castRow}>
                  <Text style={styles.castLabel}>Director:</Text>
                  <Text style={styles.castValue}>{directorName.join(", ")}</Text>
                </View>
              )}
            </View>
          )}

          {trailerUrl.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.trailerSection}>
              <Text style={styles.sectionTitle}>Trailer</Text>
              <View style={styles.trailerContainer}>
                <Video
                  ref={trailerRef}
                  source={{ uri: trailerUrl }}
                  style={styles.trailerVideo}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping
                  isMuted={trailerMuted}
                  posterSource={{ uri: trailerCoverUrl }}
                  usePoster
                  posterStyle={styles.trailerPoster}
                  onPlaybackStatusUpdate={(status) => {
                    if (!status.isLoaded) return;
                    if (status.didJustFinish) setTrailerPlaying(false);
                  }}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.6)"]}
                  style={styles.trailerGradient}
                />
                <View style={styles.trailerControls}>
                  <Pressable style={styles.trailerPlayBtn} onPress={handleTrailerToggle}>
                    <Ionicons
                      name={trailerPlaying ? "pause" : "play"}
                      size={24}
                      color={COLORS.text}
                    />
                  </Pressable>
                  <View style={styles.trailerInfo}>
                    <Text style={styles.trailerLabel}>Official Trailer</Text>
                    {trailerDuration > 0 && (
                      <Text style={styles.trailerDuration}>
                        {Math.floor(trailerDuration / 60)}:{(trailerDuration % 60).toString().padStart(2, "0")}
                      </Text>
                    )}
                  </View>
                  <Pressable style={styles.trailerMuteBtn} onPress={handleTrailerMute}>
                    <Ionicons
                      name={trailerMuted ? "volume-mute" : "volume-high"}
                      size={18}
                      color={COLORS.text}
                    />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}

          {stars.length > 0 && (
            <View style={styles.starsSection}>
              <Text style={styles.sectionTitle}>Cast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.starsRow}>
                {stars.slice(0, 10).map((star: any, idx: number) => (
                  <View key={star.staffId || idx} style={styles.starItem}>
                    <Image
                      source={{ uri: star.avatarUrl || "" }}
                      style={styles.starAvatar}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                      recyclingKey={`cast-${star.staffId || idx}`}
                    />
                    <Text style={styles.starName} numberOfLines={1}>{star.name}</Text>
                    {star.character ? (
                      <Text style={styles.starCharacter} numberOfLines={1}>{star.character}</Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {seasonTitles.length > 0 && (
            <View style={styles.episodesSection}>
              <View style={styles.episodesHeader}>
                <Text style={styles.episodesTitle}>Episodes</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.seasonSelector}
                >
                  {seasonTitles.map((sTitle, idx) => (
                    <Pressable
                      key={idx}
                      style={[
                        styles.seasonPill,
                        selectedSeasonIdx === idx && styles.seasonPillActive,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedSeasonIdx(idx);
                      }}
                    >
                      <Text
                        style={[
                          styles.seasonPillText,
                          selectedSeasonIdx === idx && styles.seasonPillTextActive,
                        ]}
                      >
                        {sTitle}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.episodeList}>
                {Array.from({ length: currentEpisodeCount }, (_, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.episodeItem}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  >
                    <View style={styles.episodeThumbnailContainer}>
                      <Image
                        source={{ uri: stillsUrl || coverUrl }}
                        style={styles.episodeThumbnail}
                        contentFit="cover"
                        transition={200}
                      />
                      <View style={styles.playOverlay}>
                        <Ionicons name="play-circle" size={28} color={COLORS.text} />
                      </View>
                    </View>
                    <View style={styles.episodeInfo}>
                      <Text style={styles.episodeNum}>E{idx + 1}</Text>
                      <Text style={styles.episodeTitle} numberOfLines={1}>
                        Episode {idx + 1}
                      </Text>
                    </View>
                    <Feather name="download" size={18} color={COLORS.textMuted} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  backdropContainer: {
    position: "relative",
    overflow: "hidden",
  },
  backdrop: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  backdropGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  backdropTopGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 130,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  scoreStar: {
    color: COLORS.accentGold,
    fontSize: 12,
  },
  scoreValue: {
    color: COLORS.accentGold,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  genreRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  genreTag: {
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genreTagText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  langToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 3,
  },
  langOption: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 17,
  },
  langOptionActive: {
    backgroundColor: COLORS.primary,
  },
  langOptionText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  langOptionTextActive: {
    color: COLORS.text,
    fontFamily: "Inter_600SemiBold",
  },
  langBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  langBadgeText: {
    color: "#000",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  actions: {
    gap: 10,
    marginBottom: 20,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.text,
    paddingVertical: 14,
    borderRadius: 8,
  },
  playBtnText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.backgroundCard,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  downloadBtnText: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  iconActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 4,
  },
  iconAction: {
    alignItems: "center",
    gap: 5,
  },
  iconActionText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 4,
  },
  moreText: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 16,
  },
  castSection: {
    marginTop: 12,
    marginBottom: 24,
    gap: 8,
  },
  castRow: {
    flexDirection: "row",
    gap: 8,
  },
  castLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    minWidth: 60,
  },
  castValue: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  trailerSection: {
    marginBottom: 24,
  },
  trailerContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.backgroundCard,
    position: "relative",
  },
  trailerVideo: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  trailerPoster: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  trailerGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  trailerControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 10,
  },
  trailerPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(229,9,20,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  trailerInfo: {
    flex: 1,
    gap: 2,
  },
  trailerLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  trailerDuration: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  trailerMuteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  starsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  starsRow: {
    gap: 14,
  },
  starItem: {
    alignItems: "center",
    width: 70,
  },
  starAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundCard,
    marginBottom: 6,
  },
  starName: {
    color: COLORS.text,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  starCharacter: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  episodesSection: {
    marginBottom: 28,
  },
  episodesHeader: {
    marginBottom: 16,
    gap: 12,
  },
  episodesTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  seasonSelector: {
    gap: 8,
  },
  seasonPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundCard,
  },
  seasonPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  seasonPillText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  seasonPillTextActive: {
    color: COLORS.text,
    fontFamily: "Inter_700Bold",
  },
  episodeList: {
    gap: 2,
  },
  episodeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  episodeThumbnailContainer: {
    position: "relative",
    width: 115,
    height: 68,
    borderRadius: 6,
    overflow: "hidden",
    flexShrink: 0,
  },
  episodeThumbnail: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  episodeInfo: {
    flex: 1,
    gap: 3,
  },
  episodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  episodeNum: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  episodeDuration: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  episodeTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  notFound: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  backLink: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
