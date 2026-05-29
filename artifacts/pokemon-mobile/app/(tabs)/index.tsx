import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getGetDashboardQueryOptions } from "@workspace/api-client-react";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return "—";
  return (n * 100).toFixed(decimals) + "%";
}

function fmtNum(n: number | null | undefined, decimals = 1): string {
  if (n == null) return "—";
  return n.toFixed(decimals);
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}

function KpiCard({ label, value, icon, highlight }: KpiCardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.kpiCard,
        {
          backgroundColor: highlight ? colors.primary : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Feather
        name={icon as any}
        size={18}
        color={highlight ? colors.primaryForeground : colors.primary}
        style={styles.kpiIcon}
      />
      <Text
        style={[
          styles.kpiValue,
          { color: highlight ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.kpiLabel,
          {
            color: highlight ? colors.primaryForeground : colors.mutedForeground,
            opacity: highlight ? 0.85 : 1,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function StreakBadge({
  streak,
  longest,
}: {
  streak: { type?: string | null; length: number };
  longest: number;
}) {
  const colors = useColors();
  if (!streak || streak.length === 0) return null;
  const isWin = streak.type === "W";
  const bg = isWin ? colors.success : colors.destructive;
  return (
    <View style={[styles.streakRow, { borderColor: colors.border }]}>
      <View style={[styles.streakBadge, { backgroundColor: bg }]}>
        <Feather
          name={isWin ? "trending-up" : "trending-down"}
          size={14}
          color="#fff"
        />
        <Text style={styles.streakText}>
          {streak.length} {isWin ? "Win" : "Loss"} Streak
        </Text>
      </View>
      <Text style={[styles.longestText, { color: colors.mutedForeground }]}>
        Best: {longest} wins
      </Text>
    </View>
  );
}

interface RecentGameRowProps {
  game: any;
}

function RecentGameRow({ game }: RecentGameRowProps) {
  const colors = useColors();
  const resultColor =
    game.result === "W"
      ? colors.success
      : game.result === "L"
        ? colors.destructive
        : colors.warning;
  const resultLabel =
    game.result === "W" ? "WIN" : game.result === "L" ? "LOSS" : "TIE";

  return (
    <View style={[styles.gameRow, { borderBottomColor: colors.border }]}>
      <View
        style={[styles.resultBadge, { backgroundColor: resultColor }]}
      >
        <Text style={styles.resultText}>{resultLabel}</Text>
      </View>
      <View style={styles.gameInfo}>
        <Text
          style={[styles.opponentText, { color: colors.foreground }]}
          numberOfLines={1}
        >
          vs {game.opponentDeck}
        </Text>
        <Text style={[styles.goingText, { color: colors.mutedForeground }]}>
          Going {game.going} · {game.format}
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const { data, isLoading, isError, refetch, isRefetching } = useQuery(
    getGetDashboardQueryOptions()
  );

  const topPad = isWeb ? 67 : insets.top;
  const botPad = isWeb ? 34 : 0;

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
          Could not load data
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

  const kpis = data?.kpis;
  const streak = data?.streak ?? { length: 0 };
  const longest = data?.longestWinStreak ?? 0;
  const recentGames = data?.recentGames ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: botPad + 100 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>
        Dashboard
      </Text>

      {streak.length > 0 && (
        <StreakBadge streak={streak} longest={longest} />
      )}

      <View style={styles.kpiGrid}>
        <KpiCard
          label="Win Rate"
          value={fmt(kpis?.winPct)}
          icon="percent"
          highlight
        />
        <KpiCard
          label="Last 10"
          value={fmt(kpis?.last10WinPct)}
          icon="activity"
        />
        <KpiCard
          label="Total Games"
          value={String(kpis?.total ?? 0)}
          icon="layers"
        />
        <KpiCard
          label="Going 1st"
          value={fmt(kpis?.going1stWinPct)}
          icon="chevrons-up"
        />
        <KpiCard
          label="Going 2nd"
          value={fmt(kpis?.going2ndWinPct)}
          icon="chevrons-down"
        />
        <KpiCard
          label="Avg Turns"
          value={fmtNum(kpis?.avgTurns)}
          icon="refresh-cw"
        />
        <KpiCard
          label="BO3 Match"
          value={fmt(kpis?.bo3MatchWinPct)}
          icon="award"
        />
        <KpiCard
          label="Mulligan %"
          value={fmt(kpis?.mulliganRate)}
          icon="rotate-ccw"
        />
      </View>

      {recentGames.length > 0 && (
        <View style={[styles.recentCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Games
          </Text>
          {recentGames.slice(0, 5).map((g: any) => (
            <RecentGameRow key={g.id} game={g} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  content: { paddingHorizontal: 16, gap: 16 },

  pageTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },

  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  streakText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  longestText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kpiCard: {
    width: "47%",
    flexGrow: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  kpiIcon: { marginBottom: 2 },
  kpiValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  recentCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultBadge: {
    width: 48,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  resultText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  gameInfo: { flex: 1 },
  opponentText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  goingText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },

  errorText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
});
