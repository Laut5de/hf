import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { Media } from "@/data/mockData";
import { MediaCard } from "./MediaCard";

interface MediaRowProps {
  title: string;
  items: Media[];
  showProgress?: boolean;
  onSeeAll?: () => void;
}

export function MediaRow({ title, items, showProgress, onSeeAll }: MediaRowProps) {
  if (!items.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <View key={item.id} style={styles.cardWrapper}>
            <MediaCard item={item} showProgress={showProgress} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  seeAll: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  cardWrapper: {},
});
