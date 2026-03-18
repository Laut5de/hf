import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { ApiSubject } from "@/data/api";
import { ApiMediaCard } from "./ApiMediaCard";

interface ApiMediaRowProps {
  title: string;
  items: ApiSubject[];
}

export function ApiMediaRow({ title, items }: ApiMediaRowProps) {
  if (!items.length) return null;

  const cleanTitle = title.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{cleanTitle}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <View key={item.subjectId} style={styles.cardWrapper}>
            <ApiMediaCard item={item} />
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
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  cardWrapper: {},
});
