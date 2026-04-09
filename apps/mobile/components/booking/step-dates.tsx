import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";

export interface DateEntry {
  date: string;
  set_time?: string;
  load_in_time?: string;
  event_name?: string;
}

interface StepDatesProps {
  dates: DateEntry[];
  onChange: (dates: DateEntry[]) => void;
}

export function StepDates({ dates, onChange }: StepDatesProps) {
  const addDate = () => {
    onChange([...dates, { date: "" }]);
  };

  const removeDate = (index: number) => {
    onChange(dates.filter((_, i) => i !== index));
  };

  const updateDate = (index: number, field: keyof DateEntry, value: string) => {
    onChange(dates.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Event Dates</Text>

      {dates.map((entry, i) => (
        <View key={i} style={styles.dateCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Date {i + 1}</Text>
            {dates.length > 1 ? (
              <Pressable onPress={() => removeDate(i)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={entry.date}
            onChangeText={(v) => updateDate(i, "date", v)}
            placeholder="2026-04-15"
            placeholderTextColor="#555"
          />

          <Text style={styles.fieldLabel}>Event Name</Text>
          <TextInput
            style={styles.input}
            value={entry.event_name ?? ""}
            onChangeText={(v) => updateDate(i, "event_name", v)}
            placeholder="Optional"
            placeholderTextColor="#555"
          />

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>Set Time</Text>
              <TextInput
                style={styles.input}
                value={entry.set_time ?? ""}
                onChangeText={(v) => updateDate(i, "set_time", v)}
                placeholder="23:00"
                placeholderTextColor="#555"
              />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>Load-in</Text>
              <TextInput
                style={styles.input}
                value={entry.load_in_time ?? ""}
                onChangeText={(v) => updateDate(i, "load_in_time", v)}
                placeholder="21:00"
                placeholderTextColor="#555"
              />
            </View>
          </View>
        </View>
      ))}

      <Pressable
        onPress={addDate}
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
      >
        <Text style={styles.addText}>+ Add Date</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  dateCard: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  removeText: {
    fontSize: 13,
    color: "#ff4444",
  },
  fieldLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  addButton: {
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  addText: {
    color: "#00e5cc",
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
