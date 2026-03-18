import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { DownloadQuality, StreamQuality } from "@/context/AppContext";

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
  badge?: string;
}

function SettingRow({
  icon,
  label,
  value,
  toggle,
  toggleValue,
  onToggle,
  onPress,
  danger,
  badge,
}: SettingRowProps) {
  return (
    <Pressable
      style={styles.settingRow}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      disabled={toggle}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
          {icon}
        </View>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
          {label}
        </Text>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {toggle && onToggle ? (
          <Switch
            value={toggleValue}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(v);
            }}
            trackColor={{ false: COLORS.surface, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        ) : !toggle ? (
          <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
        ) : null}
      </View>
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

const STREAM_QUALITY_LABELS: Record<StreamQuality, string> = {
  auto: "Auto",
  low: "Low (0.3 GB/hr)",
  medium: "Medium (0.7 GB/hr)",
  high: "High (3 GB/hr)",
  ultra: "Ultra 4K (7 GB/hr)",
};

const DOWNLOAD_QUALITY_LABELS: Record<DownloadQuality, string> = {
  standard: "Standard",
  high: "High",
  ultra: "Ultra HD",
};

function showPicker<T extends string>(
  title: string,
  options: Record<T, string>,
  current: T,
  onSelect: (v: T) => void,
) {
  const keys = Object.keys(options) as T[];
  const labels = keys.map((k) => `${options[k]}${k === current ? " ✓" : ""}`);

  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: [...labels, "Cancel"], cancelButtonIndex: labels.length, title },
      (idx) => {
        if (idx < keys.length) onSelect(keys[idx]);
      },
    );
  } else {
    Alert.alert(
      title,
      undefined,
      [
        ...keys.map((k) => ({
          text: `${options[k]}${k === current ? " ✓" : ""}`,
          onPress: () => onSelect(k),
        })),
        { text: "Cancel", style: "cancel" as const },
      ],
    );
  }
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    myList,
    settings,
    watchedCount,
    updateSettings,
    clearRecentSearches,
  } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <Text style={styles.pageTitle}>Profile</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
        }}
      >
        <LinearGradient
          colors={[COLORS.primaryDark, "#1a0008"]}
          style={styles.profileCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>U</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>User Profile</Text>
            <Text style={styles.profileEmail}>JMH STREAM v1</Text>
            <View style={styles.planBadge}>
              <Ionicons name="infinite" size={12} color={COLORS.success} />
              <Text style={[styles.planBadgeText, { color: COLORS.success }]}>Free Forever</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{myList.length}</Text>
            <Text style={styles.statLabel}>My List</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{watchedCount}</Text>
            <Text style={styles.statLabel}>Watched</Text>
          </View>
        </View>

        <SectionHeader title="Playback" />
        <View style={styles.card}>
          <SettingRow
            icon={<Feather name="play-circle" size={18} color={COLORS.textSecondary} />}
            label="Autoplay Next Episode"
            toggle
            toggleValue={settings.autoPlayNextEpisode}
            onToggle={(v) => updateSettings({ autoPlayNextEpisode: v })}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<MaterialIcons name="hd" size={18} color={COLORS.textSecondary} />}
            label="HDR Playback"
            toggle
            toggleValue={settings.hdrPlayback}
            onToggle={(v) => updateSettings({ hdrPlayback: v })}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="wifi" size={18} color={COLORS.textSecondary} />}
            label="Stream Quality"
            value={STREAM_QUALITY_LABELS[settings.streamQuality]}
            onPress={() =>
              showPicker(
                "Stream Quality",
                STREAM_QUALITY_LABELS,
                settings.streamQuality,
                (v) => updateSettings({ streamQuality: v }),
              )
            }
          />
        </View>

        <SectionHeader title="Downloads" />
        <View style={styles.card}>
          <SettingRow
            icon={<Feather name="wifi" size={18} color={COLORS.textSecondary} />}
            label="Download on Wi-Fi Only"
            toggle
            toggleValue={settings.downloadOnWifiOnly}
            onToggle={(v) => updateSettings({ downloadOnWifiOnly: v })}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="film" size={18} color={COLORS.textSecondary} />}
            label="Download Quality"
            value={DOWNLOAD_QUALITY_LABELS[settings.downloadQuality]}
            onPress={() =>
              showPicker(
                "Download Quality",
                DOWNLOAD_QUALITY_LABELS,
                settings.downloadQuality,
                (v) => updateSettings({ downloadQuality: v }),
              )
            }
          />
        </View>

        <SectionHeader title="Notifications" />
        <View style={styles.card}>
          <SettingRow
            icon={<Ionicons name="notifications-outline" size={18} color={COLORS.textSecondary} />}
            label="Push Notifications"
            toggle
            toggleValue={settings.pushNotifications}
            onToggle={(v) => updateSettings({ pushNotifications: v })}
          />
        </View>

        <SectionHeader title="Privacy & Data" />
        <View style={styles.card}>
          <SettingRow
            icon={<Feather name="bar-chart-2" size={18} color={COLORS.textSecondary} />}
            label="Reduce Data Usage"
            toggle
            toggleValue={settings.reduceDataUsage}
            onToggle={(v) => updateSettings({ reduceDataUsage: v })}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="search" size={18} color={COLORS.textSecondary} />}
            label="Clear Search History"
            onPress={() => {
              Alert.alert(
                "Clear History",
                "Are you sure you want to clear your search history?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => {
                      clearRecentSearches();
                      Alert.alert("Done", "Search history cleared.");
                    },
                  },
                ],
              );
            }}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="lock" size={18} color={COLORS.textSecondary} />}
            label="Privacy Policy"
            onPress={() => Alert.alert("Privacy Policy", "JMH STREAM does not collect or share any personal data. All preferences are stored locally on your device.")}
          />
        </View>

        <SectionHeader title="App" />
        <View style={styles.card}>
          <SettingRow
            icon={<Feather name="info" size={18} color={COLORS.textSecondary} />}
            label="App Version"
            value="v1.0.0"
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="help-circle" size={18} color={COLORS.textSecondary} />}
            label="Help & Support"
            onPress={() => Alert.alert("Support", "For help and feedback, visit our GitHub repository.")}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  profileCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLargeText: {
    color: COLORS.text,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  profileEmail: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  planBadgeText: {
    color: "#FFD700",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  sectionHeader: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 52,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowIcon: {
    width: 28,
    alignItems: "center",
  },
  rowIconDanger: {},
  rowLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  rowLabelDanger: {
    color: COLORS.error,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowValue: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
});
