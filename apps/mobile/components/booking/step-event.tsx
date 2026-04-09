import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";

export interface EventDetails {
  payer_type?: "venue" | "promoter";
  notes?: string;
}

interface StepEventProps {
  event: EventDetails;
  onChange: (event: EventDetails) => void;
}

export function StepEvent({ event, onChange }: StepEventProps) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Event Details</Text>

      <Text style={styles.fieldLabel}>Payer Type</Text>
      <View style={styles.toggleRow}>
        {(["venue", "promoter"] as const).map((type) => (
          <Pressable
            key={type}
            onPress={() => onChange({ ...event, payer_type: type })}
            style={[
              styles.toggleButton,
              event.payer_type === type && styles.toggleActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                event.payer_type === type && styles.toggleTextActive,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={event.notes ?? ""}
        onChangeText={(v) => onChange({ ...event, notes: v })}
        placeholder="Any additional details..."
        placeholderTextColor="#555"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
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
  fieldLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#111",
  },
  toggleActive: {
    backgroundColor: "#fff",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  toggleTextActive: {
    color: "#000",
  },
});
