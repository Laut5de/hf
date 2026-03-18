import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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
  SlideInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Episode, Season } from "@/data/mockData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BACKDROP_HEIGHT = 320;

function EpisodeItem({
  episode,
  onPress,
}: {
  episode: Episode;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.episodeItem} onPress={onPress}>
      <View style={styles.episodeThumbnailContainer}>
        <Image
          source={{ uri: episode.thumbnail }}
          style={styles.episodeThumbnail}
          contentFit="cover"
          transition={200}
        />
        {episode.isWatched ? (
          <View style={styles.watchedOverlay}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
          </View>
        ) : (
          <View style={styles.playOverlay}>
            <Ionicons name="play-circle" size={28} color={COLORS.text} />
          </View>
        )}
        {episode.watchProgress !== undefined && episode.watchProgress > 0 && (
          <View style={styles.epProgressBar}>
            <View
              style={[
                styles.epProgressFill,
                { width: `${episode.watchProgress * 100}%` },
              ]}
            />
          </View>
        )}
      </View>
      <View style={styles.episodeInfo}>
        <View style={styles.episodeHeader}>
          <Text style={styles.episodeNum}>E{episode.episodeNumber}</Text>
          <Text style={styles.episodeDuration}>{episode.duration}</Text>
        </View>
        <Text style={styles.episodeTitle} numberOfLines={1}>
          {episode.title}
        </Text>
        <Text style={styles.episodeDesc} numberOfLines={2}>
          {episode.description}
        </Text>
      </View>
      <Feather name="download" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
}

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getMediaById, isInWatchlist, addToWatchlist, removeFromWatchlist } =
    useApp();

  const media = getMediaById(id as string);
  const [selectedSeason, setSelectedSeason] = useState<Season | undefined>(
    media?.seasons?.[0]
  );
  const [showFullDesc, setShowFullDesc] = useState(false);

  const inWatchlist = isInWatchlist(id as string);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!media) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Content not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleWatchlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (inWatchlist) {
      removeFromWatchlist(media.id);
    } else {
      addToWatchlist(media.id);
    }
  };

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleEpisodePlay = (episode: Episode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const description =
    showFullDesc || media.description.length < 120
      ? media.description
      : media.description.slice(0, 120) + "...";

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
        }}
      >
        {/* Backdrop */}
        <View style={[styles.backdropContainer, { height: BACKDROP_HEIGHT + topInset }]}>
          <Image
            source={{ uri: media.backdrop }}
            style={styles.backdrop}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={["transparent", COLORS.background]}
            style={styles.backdropGradient}
          />
          <LinearGradient
            colors={["rgba(10,10,15,0.7)", "transparent"]}
            style={styles.backdropTopGradient}
          />

          {/* Back Button */}
          <Pressable
            style={[styles.backBtn, { top: topInset + 12 }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color={COLORS.text} />
          </Pressable>

          {/* More options */}
          <Pressable
            style={[styles.moreBtn, { top: topInset + 12 }]}
          >
            <Feather name="more-horizontal" size={22} color={COLORS.text} />
          </Pressable>
        </View>

        {/* Content */}
        <Animated.View
          entering={FadeIn.delay(200)}
          style={styles.content}
        >
          {/* Title & Meta */}
          <Text style={styles.title}>{media.title}</Text>

          <View style={styles.metaRow}>
            {media.matchPercentage && (
              <Text style={styles.matchText}>{media.matchPercentage}% Match</Text>
            )}
            <Text style={styles.metaText}>{media.year}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{media.rating}</Text>
            </View>
            <Text style={styles.metaText}>
              {media.type === "series"
                ? `${media.seasons?.length} Season${(media.seasons?.length ?? 0) > 1 ? "s" : ""}`
                : media.duration}
            </Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreStar}>★</Text>
              <Text style={styles.scoreValue}>{media.score.toFixed(1)}</Text>
            </View>
          </View>

          {/* Genre Tags */}
          <View style={styles.genreRow}>
            {media.genre.map((g) => (
              <View key={g} style={styles.genreTag}>
                <Text style={styles.genreTagText}>{g}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <Animated.View entering={SlideInDown.delay(300)} style={styles.actions}>
            <Pressable style={styles.playBtn} onPress={handlePlay}>
              <Ionicons name="play" size={20} color="#000" />
              <Text style={styles.playBtnText}>
                {media.watchProgress ? "Resume" : "Play"}
              </Text>
            </Pressable>

            {media.type === "series" && (
              <Pressable style={styles.downloadBtn}>
                <Feather name="download" size={18} color={COLORS.text} />
                <Text style={styles.downloadBtnText}>Download S1</Text>
              </Pressable>
            )}
          </Animated.View>

          {/* Icon Actions */}
          <View style={styles.iconActions}>
            <TouchableOpacity
              style={styles.iconAction}
              onPress={handleWatchlist}
            >
              <Ionicons
                name={inWatchlist ? "checkmark-circle" : "add-circle-outline"}
                size={24}
                color={inWatchlist ? COLORS.success : COLORS.text}
              />
              <Text style={styles.iconActionText}>
                {inWatchlist ? "Saved" : "My List"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconAction}>
              <Feather name="thumbs-up" size={22} color={COLORS.text} />
              <Text style={styles.iconActionText}>Rate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconAction}>
              <Feather name="share-2" size={22} color={COLORS.text} />
              <Text style={styles.iconActionText}>Share</Text>
            </TouchableOpacity>

            {media.type === "series" && (
              <TouchableOpacity style={styles.iconAction}>
                <MaterialCommunityIcons
                  name="progress-download"
                  size={23}
                  color={COLORS.text}
                />
                <Text style={styles.iconActionText}>Download</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
          <Pressable onPress={() => setShowFullDesc((s) => !s)}>
            <Text style={styles.description}>{description}</Text>
            {media.description.length > 120 && (
              <Text style={styles.moreText}>
                {showFullDesc ? "Less" : "More"}
              </Text>
            )}
          </Pressable>

          {/* Cast & Crew */}
          <View style={styles.castSection}>
            <View style={styles.castRow}>
              <Text style={styles.castLabel}>Cast:</Text>
              <Text style={styles.castValue} numberOfLines={1}>
                {media.cast.join(", ")}
              </Text>
            </View>
            {media.director && (
              <View style={styles.castRow}>
                <Text style={styles.castLabel}>Director:</Text>
                <Text style={styles.castValue}>{media.director}</Text>
              </View>
            )}
          </View>

          {/* Episodes Section for Series */}
          {media.type === "series" && media.seasons && (
            <View style={styles.episodesSection}>
              <View style={styles.episodesHeader}>
                <Text style={styles.episodesTitle}>Episodes</Text>

                {/* Season Selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.seasonSelector}
                >
                  {media.seasons.map((season) => (
                    <Pressable
                      key={season.id}
                      style={[
                        styles.seasonPill,
                        selectedSeason?.id === season.id && styles.seasonPillActive,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedSeason(season);
                      }}
                    >
                      <Text
                        style={[
                          styles.seasonPillText,
                          selectedSeason?.id === season.id &&
                            styles.seasonPillTextActive,
                        ]}
                      >
                        Season {season.seasonNumber}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Episode List */}
              <View style={styles.episodeList}>
                {selectedSeason?.episodes.map((episode) => (
                  <EpisodeItem
                    key={episode.id}
                    episode={episode}
                    onPress={() => handleEpisodePlay(episode)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* More Like This */}
          <View style={styles.moreLikeThis}>
            <Text style={styles.moreLikeTitle}>More Like This</Text>
            <Text style={styles.moreLikeHint}>
              Based on {media.genre[0]} content you've watched
            </Text>
          </View>
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
  matchText: {
    color: COLORS.success,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  ratingBadge: {
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  ratingText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
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
  watchedOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  epProgressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  epProgressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
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
  episodeDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  moreLikeThis: {
    marginBottom: 20,
  },
  moreLikeTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  moreLikeHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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
