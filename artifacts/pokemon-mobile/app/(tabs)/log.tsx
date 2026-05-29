import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGetDashboardQueryKey,
  getGetGamesMetaQueryOptions,
  getListGamesQueryKey,
  useCreateGame,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Format = "BO1" | "BO3";
type Going = "1st" | "2nd";
type Result = "W" | "L" | "T";

function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  labelMap,
  colorMap,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labelMap?: Record<string, string>;
  colorMap?: Record<string, string>;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.segment,
        { backgroundColor: colors.secondary, borderColor: colors.border },
      ]}
    >
      {options.map((opt) => {
        const active = opt === value;
        const activeBg = colorMap?.[opt] ?? colors.primary;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              styles.segmentOption,
              active && { backgroundColor: activeBg },
            ]}
            onPress={() => onChange(opt)}
            testID={`seg-${opt}`}
          >
            <Text
              style={[
                styles.segmentText,
                { color: active ? "#fff" : colors.foreground },
              ]}
            >
              {labelMap?.[opt] ?? opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PickerRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.pickerSection}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {options.map((opt) => {
          const active = opt === value;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onChange(opt)}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: active ? colors.primaryForeground : colors.foreground,
                  },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const EVENTS = ["Casual", "League", "Regional", "Prerelease", "PTCGO", "Other"];

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const qc = useQueryClient();

  const { data: meta, isLoading: metaLoading } = useQuery(
    getGetGamesMetaQueryOptions()
  );

  const [format, setFormat] = useState<Format>("BO1");
  const [going, setGoing] = useState<Going>("1st");
  const [result, setResult] = useState<Result>("W");
  const [opponentDeck, setOpponentDeck] = useState("");
  const [event, setEvent] = useState("Casual");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  const { mutate, isPending } = useCreateGame({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        qc.invalidateQueries({ queryKey: getListGamesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setSuccess(true);
        setOpponentDeck("");
        setNotes("");
        setResult("W");
        setGoing("1st");
        setTimeout(() => setSuccess(false), 2500);
      },
    },
  });

  const canSubmit = opponentDeck.trim().length > 0 && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    mutate({
      data: {
        format,
        going,
        result,
        opponentDeck: opponentDeck.trim(),
        event,
        notes: notes.trim() || null,
        myMulligans: 0,
        oppMulligans: 0,
        playedAt: Date.now(),
        newMatch: true,
        matchId: null,
        gameNumber: null,
      },
    });
  }

  const topPad = isWeb ? 67 : insets.top;
  const botPad = isWeb ? 34 : insets.bottom;
  const opponentDecks = meta?.opponentDecks ?? [];

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: botPad + 100 },
      ]}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>
        Log Game
      </Text>

      {success && (
        <View
          style={[styles.successBanner, { backgroundColor: colors.success }]}
        >
          <Feather name="check-circle" size={16} color="#fff" />
          <Text style={styles.successText}>Game logged!</Text>
        </View>
      )}

      <Field label="FORMAT">
        <SegmentControl<Format>
          options={["BO1", "BO3"]}
          value={format}
          onChange={setFormat}
        />
      </Field>

      <Field label="RESULT">
        <SegmentControl<Result>
          options={["W", "L", "T"]}
          value={result}
          onChange={setResult}
          labelMap={{ W: "WIN", L: "LOSS", T: "TIE" }}
          colorMap={{
            W: colors.success,
            L: colors.destructive,
            T: colors.warning,
          }}
        />
      </Field>

      <Field label="GOING">
        <SegmentControl<Going>
          options={["1st", "2nd"]}
          value={going}
          onChange={setGoing}
          labelMap={{ "1st": "1st (Coin)", "2nd": "2nd" }}
        />
      </Field>

      {metaLoading ? (
        <View style={styles.metaLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <PickerRow
          label="OPPONENT DECK"
          options={opponentDecks}
          value={opponentDeck}
          onChange={setOpponentDeck}
        />
      )}

      <Field label="OR TYPE OPPONENT DECK">
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.card,
              borderColor: opponentDeck ? colors.primary : colors.border,
              color: colors.foreground,
            },
          ]}
          value={opponentDeck}
          onChangeText={setOpponentDeck}
          placeholder="e.g. Charizard ex"
          placeholderTextColor={colors.mutedForeground}
          testID="opponent-deck-input"
        />
      </Field>

      <PickerRow
        label="EVENT"
        options={EVENTS}
        value={event}
        onChange={setEvent}
      />

      <Field label="NOTES">
        <TextInput
          style={[
            styles.textInput,
            styles.notesInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any notes about this game..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
          testID="notes-input"
        />
      </Field>

      <TouchableOpacity
        style={[
          styles.submitBtn,
          {
            backgroundColor: canSubmit ? colors.primary : colors.muted,
            opacity: canSubmit ? 1 : 0.6,
          },
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        testID="submit-btn"
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Feather name="plus-circle" size={18} color="#fff" />
            <Text style={styles.submitText}>Log Game</Text>
          </>
        )}
      </TouchableOpacity>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 20 },

  pageTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 4,
  },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  successText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },

  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  segment: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  pickerSection: { gap: 8 },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 11,
  },

  metaLoading: { paddingVertical: 8, alignItems: "flex-start" },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 4,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
