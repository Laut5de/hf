import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { myList, clearRecentSearches } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [autoPlay, setAutoPlay] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [hdr, setHdr] = useState(false);
  const [dataUsage, setDataUsage] = useState(false);
  const [downloadOnWifi, setDownloadOnWifi] = useState(true);

  const plan = "Free";
  const appVersion = "v1";

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <Text style={styles.pageTitle}>Profile</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
        }}
      >
        {/* Profile Card */}
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
          <Pressable style={styles.editProfileBtn}>
            <Feather name="edit-2" size={16} color={COLORS.text} />
          </Pressable>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{myList.length}</Text>
            <Text style={styles.statLabel}>My List</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Downloads</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>47</Text>
            <Text style={styles.statLabel}>Watched</Text>
          </View>
        </View>


        {/* Playback */}
        <SectionHeader title="Playback" />
        <View style={styles.card}>
          <SettingRow
            icon={<Feather name="play-circle" size={18} color={COLORS.textSecondary} />}
            label="Autoplay Next Episode"
            toggle
            toggleValue={autoPlay}
            onToggle={setAutoPlay}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<MaterialIcons name="hd" size={18} color={COLORS.textSecondary} />}
            label="HDR Playback"
            toggle
            toggleValue={hdr}
            onToggle={setHdr}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="wifi" size={18} color={COLORS.textSecondary} />}
            label="Stream Quality"
            value="Auto"
            onPress={() =>
              Alert.alert("Quality", "Auto\nLow (0.3GB/hr)\nMedium (0.7GB/hr)\nHigh (3GB/hr)\nUltra 4K (7GB/hr)")
            }
          />
        </View>

        {/* Downloads */}
        <SectionHeader title="Downloads" />
        <View style={styles.card}>
          <SettingRow
            icon={<Feather name="wifi" size={18} color={COLORS.textSecondary} />}
            label="Download on Wi-Fi Only"
            toggle
            toggleValue={downloadOnWifi}
            onToggle={setDownloadOnWifi}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="film" size={18} color={COLORS.textSecondary} />}
            label="Download Quality"
            value="High"
            onPress={() => Alert.alert("Quality", "Standard\nHigh\nUltra HD")}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="hard-drive" size={18} color={COLORS.textSecondary} />}
            label="Storage Used"
            value="3.6 GB"
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={styles.card}>
          <SettingRow
            icon={<Ionicons name="notifications-outline" size={18} color={COLORS.textSecondary} />}
            label="Push Notifications"
            toggle
            toggleValue={notifications}
            onToggle={setNotifications}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="bell" size={18} color={COLORS.textSecondary} />}
            label="New Releases"
            badge="NEW"
            onPress={() => {}}
          />
        </View>

        {/* Privacy */}
        <SectionHeader title="Privacy & Data" />
        <View style={styles.card}>
          <SettingRow
            icon={<Feather name="bar-chart-2" size={18} color={COLORS.textSecondary} />}
            label="Reduce Data Usage"
            toggle
            toggleValue={dataUsage}
            onToggle={setDataUsage}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="search" size={18} color={COLORS.textSecondary} />}
            label="Clear Search History"
            onPress={() => {
              clearRecentSearches();
              Alert.alert("Done", "Search history cleared.");
            }}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="lock" size={18} color={COLORS.textSecondary} />}
            label="Privacy Policy"
            onPress={() => Alert.alert("Privacy", "View privacy policy")}
          />
        </View>

        {/* App */}
        <SectionHeader title="App" />
        <View style={styles.card}>
          <SettingRow
            icon={<Feather name="info" size={18} color={COLORS.textSecondary} />}
            label="App Version"
            value="v1"
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="star" size={18} color={COLORS.textSecondary} />}
            label="Rate JMH STREAM"
            onPress={() => Alert.alert("Rate", "Opening App Store...")}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Feather name="help-circle" size={18} color={COLORS.textSecondary} />}
            label="Help & Support"
            onPress={() => Alert.alert("Support", "Opening support...")}
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
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
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
