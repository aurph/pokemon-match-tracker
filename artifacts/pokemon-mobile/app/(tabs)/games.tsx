import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getListGamesQueryOptions } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

function GameCard({ game }: { game: any }) {
  const colors = useColors();
  const resultColor =
    game.result === "W"
      ? colors.success
      : game.result === "L"
        ? colors.destructive
        : colors.warning;
  const resultLabel =
    game.result === "W" ? "WIN" : game.result === "L" ? "LOSS" : "TIE";

  const date = new Date(game.playedAt);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.resultStripe, { backgroundColor: resultColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text
            style={[styles.opponentName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            vs {game.opponentDeck}
          </Text>
          <View style={[styles.resultPill, { backgroundColor: resultColor }]}>
            <Text style={styles.resultPillText}>{resultLabel}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Feather name="arrow-up-right" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {game.going}
            </Text>
          </View>
          <View style={styles.metaDot} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {game.format}
          </Text>
          {game.event && game.event !== "Casual" && (
            <>
              <View style={styles.metaDot} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {game.event}
              </Text>
            </>
          )}
          <View style={{ flex: 1 }} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {dateStr}
          </Text>
        </View>
      </View>
    </View>
  );
}

type FilterResult = "all" | "W" | "L" | "T";

export default function GamesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [filter, setFilter] = useState<FilterResult>("all");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery(
    getListGamesQueryOptions()
  );

  const topPad = isWeb ? 67 : insets.top;
  const botPad = isWeb ? 34 : 0;

  const games = data ?? [];
  const sorted = [...games].sort((a, b) => b.playedAt - a.playedAt);
  const filtered =
    filter === "all" ? sorted : sorted.filter((g) => g.result === filter);

  const filters: { label: string; value: FilterResult }[] = [
    { label: "All", value: "all" },
    { label: "Wins", value: "W" },
    { label: "Losses", value: "L" },
    { label: "Ties", value: "T" },
  ];

  if (isLoading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingTop: topPad },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingTop: topPad },
        ]}
      >
        <Feather name="wifi-off" size={36} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Could not load games
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: "600" }}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Games
        </Text>
        <Text style={[styles.gameCount, { color: colors.mutedForeground }]}>
          {filtered.length} game{filtered.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === f.value ? colors.primary : colors.card,
                borderColor:
                  filter === f.value ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filter === f.value
                      ? colors.primaryForeground
                      : colors.foreground,
                },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <GameCard game={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: botPad + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No games yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
            >
              Log your first game to see it here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  gameCount: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  listContent: { paddingHorizontal: 16, gap: 10, paddingTop: 4 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  resultStripe: { width: 4 },
  cardBody: { flex: 1, padding: 12 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  opponentName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  resultPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultPillText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 2 },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#ccc",
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  errorText: { fontSize: 16, fontFamily: "Inter_500Medium", marginTop: 8 },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
});
