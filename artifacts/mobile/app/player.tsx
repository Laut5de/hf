import { Feather, Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import {
  ApiCaption,
  ApiSourceDownload,
  ApiSourcesData,
  fetchSources,
} from "@/data/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: string): string {
  const b = parseInt(bytes, 10);
  if (isNaN(b)) return "";
  if (b > 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  return `${(b / 1e6).toFixed(0)} MB`;
}

interface SrtCue {
  start: number;
  end: number;
  text: string;
}

function parseSrtTime(timeStr: string): number {
  const parts = timeStr.trim().replace(",", ".").split(":");
  if (parts.length < 3) return 0;
  const h = parseFloat(parts[0]);
  const m = parseFloat(parts[1]);
  const s = parseFloat(parts[2]);
  return (h * 3600 + m * 60 + s) * 1000;
}

function parseSrt(srtText: string): SrtCue[] {
  const cues: SrtCue[] = [];
  const blocks = srtText.trim().replace(/\r\n/g, "\n").split("\n\n");
  for (const block of blocks) {
    const lines = block.split("\n");
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;
    const [startStr, endStr] = timeLine.split("-->");
    const start = parseSrtTime(startStr);
    const end = parseSrtTime(endStr);
    const textIdx = lines.indexOf(timeLine) + 1;
    const text = lines
      .slice(textIdx)
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (text) cues.push({ start, end, text });
  }
  return cues;
}

export default function PlayerScreen() {
  const { id, title, localPath } = useLocalSearchParams<{ id: string; title: string; localPath?: string }>();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const { settings, incrementWatched } = useApp();
  const hasTrackedWatch = useRef(false);

  const [sources, setSources] = useState<ApiSourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedQuality, setSelectedQuality] = useState<ApiSourceDownload | null>(null);
  const [selectedCaption, setSelectedCaption] = useState<ApiCaption | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  const [showControls, setShowControls] = useState(true);
  const [showQualityPicker, setShowQualityPicker] = useState(false);
  const [showCaptionPicker, setShowCaptionPicker] = useState(false);

  const [captionCues, setCaptionCues] = useState<SrtCue[]>([]);
  const [currentCueText, setCurrentCueText] = useState("");

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    hasTrackedWatch.current = false;
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(false);

      if (localPath) {
        const localSource: ApiSourceDownload = {
          id: "local",
          resolution: 0,
          size: "0",
          url: localPath,
          proxyUrl: localPath,
        };
        setSelectedQuality(localSource);
        setSources({ downloads: [localSource], captions: [] });
        setLoading(false);
        return;
      }

      const data = await fetchSources(id as string);
      if (data && data.downloads.length > 0) {
        setSources(data);

        const qualityMap: Record<string, number> = {
          low: 360,
          medium: 480,
          high: 1080,
          ultra: 2160,
        };
        const preferred = qualityMap[settings.streamQuality] || 0;
        let pick: ApiSourceDownload;
        if (settings.streamQuality === "auto" || preferred === 0) {
          pick = data.downloads.reduce((a, b) =>
            a.resolution > b.resolution ? a : b
          );
        } else {
          const sorted = [...data.downloads].sort(
            (a, b) =>
              Math.abs(a.resolution - preferred) - Math.abs(b.resolution - preferred)
          );
          pick = sorted[0];
        }
        setSelectedQuality(pick);

        const enCaption = data.captions.find((c) => c.lan === "en");
        if (enCaption) {
          setSelectedCaption(enCaption);
          setCaptionsEnabled(true);
        }
      } else {
        setError(true);
      }
      setLoading(false);
    })();
  }, [id, localPath, settings.streamQuality]);

  useEffect(() => {
    if (!selectedCaption || !captionsEnabled) {
      setCaptionCues([]);
      setCurrentCueText("");
      return;
    }
    (async () => {
      try {
        const res = await fetch(selectedCaption.url);
        if (!res.ok) return;
        const srtText = await res.text();
        const cues = parseSrt(srtText);
        setCaptionCues(cues);
      } catch {
        setCaptionCues([]);
      }
    })();
  }, [selectedCaption, captionsEnabled]);

  useEffect(() => {
    if (!captionsEnabled || captionCues.length === 0) {
      if (currentCueText) setCurrentCueText("");
      return;
    }
    const cue = captionCues.find((c) => positionMs >= c.start && positionMs <= c.end);
    setCurrentCueText(cue?.text || "");
  }, [positionMs, captionCues, captionsEnabled]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 4000);
  }, [isPlaying]);

  const toggleControls = useCallback(() => {
    setShowControls((prev) => {
      if (!prev) scheduleHide();
      return !prev;
    });
    setShowQualityPicker(false);
    setShowCaptionPicker(false);
  }, [scheduleHide]);

  useEffect(() => {
    if (showControls && isPlaying) scheduleHide();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showControls, isPlaying, scheduleHide]);

  const handlePlayPause = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
    scheduleHide();
  }, [isPlaying, scheduleHide]);

  const handleSeek = useCallback(async (fraction: number) => {
    const pos = fraction * durationMs;
    await videoRef.current?.setPositionAsync(pos);
    setPositionMs(pos);
  }, [durationMs]);

  const handleBack = () => {
    router.back();
  };

  const handleQualityChange = useCallback((q: ApiSourceDownload) => {
    setSelectedQuality(q);
    setShowQualityPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleCaptionChange = useCallback((c: ApiCaption | null) => {
    setSelectedCaption(c);
    setCaptionsEnabled(c !== null);
    setShowCaptionPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleMute = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted((prev) => !prev);
  }, []);

  const handleVolumeStep = useCallback((direction: "up" | "down") => {
    setVolume((prev) => {
      const next = direction === "up" ? Math.min(1, prev + 0.1) : Math.max(0, prev - 0.1);
      return Math.round(next * 10) / 10;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSkip = useCallback(async (seconds: number) => {
    const newPos = Math.max(0, Math.min(durationMs, positionMs + seconds * 1000));
    await videoRef.current?.setPositionAsync(newPos);
    setPositionMs(newPos);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [positionMs, durationMs]);

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  if (error || !selectedQuality) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>Video source unavailable</Text>
        <Pressable style={styles.backBtnError} onPress={handleBack}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Video
        ref={videoRef}
        source={{ uri: localPath ? selectedQuality.url : (selectedQuality.proxyUrl || selectedQuality.url) }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={isPlaying}
        volume={isMuted ? 0 : volume}
        onPlaybackStatusUpdate={(status) => {
          if (!status.isLoaded) return;
          setPositionMs(status.positionMillis || 0);
          setDurationMs(status.durationMillis || 0);
          setIsBuffering(status.isBuffering || false);
          setIsPlaying(status.isPlaying);
          if (
            !hasTrackedWatch.current &&
            status.durationMillis &&
            status.positionMillis &&
            status.positionMillis > status.durationMillis * 0.1
          ) {
            hasTrackedWatch.current = true;
            incrementWatched();
          }
        }}
        onError={() => setError(true)}
      />

      <Pressable style={styles.touchLayer} onPress={toggleControls} />

      {isBuffering && !loading && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="large" color={COLORS.text} />
        </View>
      )}

      {captionsEnabled && currentCueText.length > 0 && (
        <View style={styles.subtitleContainer} pointerEvents="none">
          <View style={styles.subtitleBg}>
            <Text style={styles.subtitleText}>{currentCueText}</Text>
          </View>
        </View>
      )}

      {showControls && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.controlsOverlay}
        >
          <View style={[styles.topControls, { paddingTop: Platform.OS === "web" ? 16 : insets.top + 8 }]}>
            <Pressable style={styles.controlBtn} onPress={handleBack}>
              <Feather name="arrow-left" size={24} color={COLORS.text} />
            </Pressable>
            <View style={styles.titleArea}>
              <Text style={styles.playerTitle} numberOfLines={1}>
                {title || "Now Playing"}
              </Text>
              {selectedQuality && (
                <Text style={styles.qualityLabel}>{selectedQuality.resolution}p</Text>
              )}
            </View>
            <View style={styles.topRight}>
              <Pressable
                style={styles.controlBtn}
                onPress={() => {
                  setShowCaptionPicker((p) => !p);
                  setShowQualityPicker(false);
                }}
              >
                <Ionicons
                  name={captionsEnabled ? "text" : "text-outline"}
                  size={22}
                  color={captionsEnabled ? COLORS.primary : COLORS.text}
                />
              </Pressable>
              <Pressable style={styles.controlBtn} onPress={toggleMute}>
                <Ionicons
                  name={isMuted ? "volume-mute" : volume > 0.5 ? "volume-high" : "volume-low"}
                  size={22}
                  color={COLORS.text}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.centerControls}>
            <Pressable style={styles.skipBtn} onPress={() => handleSkip(-10)}>
              <Ionicons name="play-back" size={28} color={COLORS.text} />
              <Text style={styles.skipText}>10</Text>
            </Pressable>

            <Pressable style={styles.playPauseBtn} onPress={handlePlayPause}>
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={36}
                color={COLORS.text}
              />
            </Pressable>

            <Pressable style={styles.skipBtn} onPress={() => handleSkip(10)}>
              <Ionicons name="play-forward" size={28} color={COLORS.text} />
              <Text style={styles.skipText}>10</Text>
            </Pressable>
          </View>

          <View style={[styles.bottomControls, { paddingBottom: Platform.OS === "web" ? 16 : insets.bottom + 8 }]}>
            <View style={styles.seekRow}>
              <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
              <Pressable
                style={styles.seekBar}
                onPress={(e) => {
                  const x = (e as any).nativeEvent?.locationX ?? 0;
                  const barWidth = SCREEN_WIDTH - 140;
                  handleSeek(Math.max(0, Math.min(1, x / barWidth)));
                }}
              >
                <View style={styles.seekTrack}>
                  <View style={[styles.seekFill, { width: `${progress * 100}%` }]} />
                  <View style={[styles.seekThumb, { left: `${progress * 100}%` }]} />
                </View>
              </Pressable>
              <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
            </View>

            <View style={styles.bottomActions}>
              <Pressable
                style={styles.actionBtn}
                onPress={() => {
                  setShowQualityPicker((p) => !p);
                  setShowCaptionPicker(false);
                }}
              >
                <Ionicons name="settings-outline" size={20} color={COLORS.text} />
                <Text style={styles.actionText}>Quality</Text>
              </Pressable>

              <View style={styles.volumeControls}>
                <Pressable style={styles.volBtn} onPress={() => handleVolumeStep("down")}>
                  <Ionicons name="remove" size={18} color={COLORS.text} />
                </Pressable>
                <View style={styles.volBar}>
                  <View style={[styles.volFill, { width: `${(isMuted ? 0 : volume) * 100}%` }]} />
                </View>
                <Pressable style={styles.volBtn} onPress={() => handleVolumeStep("up")}>
                  <Ionicons name="add" size={18} color={COLORS.text} />
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {showQualityPicker && sources && (
        <Animated.View entering={FadeIn.duration(150)} style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Video Quality</Text>
            {sources.downloads
              .sort((a, b) => b.resolution - a.resolution)
              .map((dl) => (
                <Pressable
                  key={dl.id}
                  style={[
                    styles.pickerItem,
                    selectedQuality?.id === dl.id && styles.pickerItemActive,
                  ]}
                  onPress={() => handleQualityChange(dl)}
                >
                  <View style={styles.pickerItemLeft}>
                    <Text style={[
                      styles.pickerItemText,
                      selectedQuality?.id === dl.id && styles.pickerItemTextActive,
                    ]}>
                      {dl.resolution}p
                    </Text>
                    <Text style={styles.pickerItemMeta}>{formatBytes(dl.size)}</Text>
                  </View>
                  {selectedQuality?.id === dl.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </Pressable>
              ))}
            <Pressable style={styles.pickerClose} onPress={() => setShowQualityPicker(false)}>
              <Text style={styles.pickerCloseText}>Close</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {showCaptionPicker && sources && (
        <Animated.View entering={FadeIn.duration(150)} style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Subtitles</Text>
            <Pressable
              style={[
                styles.pickerItem,
                !captionsEnabled && styles.pickerItemActive,
              ]}
              onPress={() => handleCaptionChange(null)}
            >
              <Text style={[
                styles.pickerItemText,
                !captionsEnabled && styles.pickerItemTextActive,
              ]}>
                Off
              </Text>
              {!captionsEnabled && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </Pressable>
            {sources.captions.map((cap) => (
              <Pressable
                key={cap.id}
                style={[
                  styles.pickerItem,
                  selectedCaption?.id === cap.id && captionsEnabled && styles.pickerItemActive,
                ]}
                onPress={() => handleCaptionChange(cap)}
              >
                <Text style={[
                  styles.pickerItemText,
                  selectedCaption?.id === cap.id && captionsEnabled && styles.pickerItemTextActive,
                ]}>
                  {cap.lanName}
                </Text>
                {selectedCaption?.id === cap.id && captionsEnabled && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </Pressable>
            ))}
            <Pressable style={styles.pickerClose} onPress={() => setShowCaptionPicker(false)}>
              <Text style={styles.pickerCloseText}>Close</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "absolute",
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitleContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  subtitleBg: {
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    maxWidth: "90%",
  },
  subtitleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 22,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 12,
  },
  errorText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginTop: 12,
  },
  backBtnError: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "space-between",
  },
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleArea: {
    flex: 1,
    gap: 2,
  },
  playerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  qualityLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  topRight: {
    flexDirection: "row",
    gap: 6,
  },
  centerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  skipBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
  },
  skipText: {
    color: COLORS.text,
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    position: "absolute",
    bottom: 4,
  },
  playPauseBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomControls: {
    paddingHorizontal: 16,
    gap: 12,
  },
  seekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeText: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 55,
    textAlign: "center",
  },
  seekBar: {
    flex: 1,
    height: 30,
    justifyContent: "center",
  },
  seekTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    position: "relative",
  },
  seekFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  seekThumb: {
    position: "absolute",
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    marginLeft: -7,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  volumeControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  volBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  volBar: {
    width: 80,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  volFill: {
    height: "100%",
    backgroundColor: COLORS.text,
    borderRadius: 2,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerCard: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 16,
    padding: 20,
    width: 280,
    gap: 4,
  },
  pickerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  pickerItemActive: {
    backgroundColor: "rgba(229,9,20,0.12)",
  },
  pickerItemLeft: {
    gap: 2,
  },
  pickerItemText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  pickerItemTextActive: {
    color: COLORS.text,
    fontFamily: "Inter_700Bold",
  },
  pickerItemMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  pickerClose: {
    marginTop: 8,
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pickerCloseText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
