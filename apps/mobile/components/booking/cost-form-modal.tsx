import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { BookingCost, CostCategory } from "@clubstack/shared";

const CATEGORIES: { value: CostCategory; label: string }[] = [
  { value: "travel", label: "Travel" },
  { value: "accommodation", label: "Accommodation" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
];

interface CostFormModalProps {
  visible: boolean;
  existing?: BookingCost | null;
  onSave: (data: {
    description: string;
    amount: number;
    category: CostCategory | null;
  }) => void;
  onClose: () => void;
}

export function CostFormModal({
  visible,
  existing,
  onSave,
  onClose,
}: CostFormModalProps) {
  const [description, setDescription] = useState(existing?.description ?? "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [category, setCategory] = useState<CostCategory | null>(
    existing?.category ?? null
  );

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount < 0) return;
    onSave({ description: description.trim(), amount: parsedAmount, category });
  };

  const isValid =
    description.trim().length > 0 &&
    amount.length > 0 &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) >= 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>
            {existing ? "Edit Cost" : "Add Cost"}
          </Text>
          <Pressable onPress={handleSave} disabled={!isValid}>
            <Text style={[styles.saveText, !isValid && styles.saveDisabled]}>
              Save
            </Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Equipment rental"
            placeholderTextColor="#555"
            autoFocus
          />

          <Text style={styles.label}>Amount ($)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#555"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() =>
                  setCategory(category === cat.value ? null : cat.value)
                }
                style={[
                  styles.categoryChip,
                  category === cat.value && styles.categoryActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.value && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#222",
  },
  cancelText: {
    fontSize: 16,
    color: "#888",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00e5cc",
  },
  saveDisabled: {
    opacity: 0.4,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#111",
  },
  categoryActive: {
    backgroundColor: "#fff",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  categoryTextActive: {
    color: "#000",
  },
});
