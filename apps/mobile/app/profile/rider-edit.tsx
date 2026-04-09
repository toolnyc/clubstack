import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import type { EquipmentRequirements } from "@clubstack/shared";

import { Text, View, useThemeColor } from "@/components/Themed";
import { useDJProfile } from "@/lib/use-dj-profile";
import { getRider, saveRider } from "@/lib/technical-rider";

const EQUIPMENT_FIELDS: {
  key: keyof EquipmentRequirements;
  label: string;
  modelKey?: keyof EquipmentRequirements;
  modelPlaceholder?: string;
}[] = [
  {
    key: "cdjs",
    label: "CDJs",
    modelKey: "cdj_model",
    modelPlaceholder: "e.g. CDJ-3000",
  },
  {
    key: "turntables",
    label: "Turntables",
    modelKey: "turntable_model",
    modelPlaceholder: "e.g. Technics 1210",
  },
  {
    key: "mixer",
    label: "Mixer",
    modelKey: "mixer_model",
    modelPlaceholder: "e.g. DJM-900NXS2",
  },
  { key: "needles_provided", label: "Needles Provided" },
  { key: "usb_required", label: "USB Required" },
  { key: "laptop_stand", label: "Laptop Stand" },
];

export default function RiderEditScreen() {
  const { djProfile } = useDJProfile();
  const router = useRouter();
  const tint = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  const [equipment, setEquipment] = useState<EquipmentRequirements>({});
  const [boothMonitors, setBoothMonitors] = useState("");
  const [boothRequirements, setBoothRequirements] = useState("");
  const [powerRequirements, setPowerRequirements] = useState("");
  const [hospitality, setHospitality] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!djProfile?.id) return;
    getRider(djProfile.id)
      .then((rider) => {
        if (rider) {
          setEquipment(rider.equipment);
          setBoothMonitors(rider.booth_monitors ?? "");
          setBoothRequirements(rider.booth_requirements ?? "");
          setPowerRequirements(rider.power_requirements ?? "");
          setHospitality(rider.hospitality ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [djProfile?.id]);

  const toggleEquipment = (key: keyof EquipmentRequirements) => {
    setEquipment((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setModel = (key: keyof EquipmentRequirements, value: string) => {
    setEquipment((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = useCallback(async () => {
    if (!djProfile?.id) return;

    setSaving(true);
    try {
      await saveRider(djProfile.id, {
        equipment,
        booth_monitors: boothMonitors.trim() || null,
        booth_requirements: boothRequirements.trim() || null,
        power_requirements: powerRequirements.trim() || null,
        hospitality: hospitality.trim() || null,
      });
      router.back();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to save rider"
      );
    } finally {
      setSaving(false);
    }
  }, [
    djProfile?.id,
    equipment,
    boothMonitors,
    boothRequirements,
    powerRequirements,
    hospitality,
    router,
  ]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Equipment */}
      <Text style={styles.sectionTitle}>Equipment</Text>
      {EQUIPMENT_FIELDS.map((field) => (
        <View key={field.key} style={styles.equipmentItem}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>{field.label}</Text>
            <Switch
              value={!!equipment[field.key]}
              onValueChange={() => toggleEquipment(field.key)}
              trackColor={{ true: tint }}
            />
          </View>
          {field.modelKey && equipment[field.key] ? (
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={(equipment[field.modelKey] as string) ?? ""}
              onChangeText={(v) => setModel(field.modelKey!, v)}
              placeholder={field.modelPlaceholder}
              placeholderTextColor="#999"
            />
          ) : null}
        </View>
      ))}

      <Text style={styles.label}>Other Equipment</Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={equipment.other ?? ""}
        onChangeText={(v) => setEquipment((prev) => ({ ...prev, other: v }))}
        placeholder="Any other equipment needs"
        placeholderTextColor="#999"
      />

      {/* Booth Requirements */}
      <Text style={styles.sectionTitle}>Booth Requirements</Text>

      <Text style={styles.label}>Monitors</Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={boothMonitors}
        onChangeText={setBoothMonitors}
        placeholder="e.g. 2x powered monitors on stands"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Booth Setup</Text>
      <TextInput
        style={[styles.input, styles.multiline, { color: textColor }]}
        value={boothRequirements}
        onChangeText={setBoothRequirements}
        placeholder="Table dimensions, placement, etc."
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Power</Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={powerRequirements}
        onChangeText={setPowerRequirements}
        placeholder="e.g. 2x 110V outlets within 6ft"
        placeholderTextColor="#999"
      />

      {/* Hospitality */}
      <Text style={styles.sectionTitle}>Hospitality</Text>
      <TextInput
        style={[styles.input, styles.multiline, { color: textColor }]}
        value={hospitality}
        onChangeText={setHospitality}
        placeholder="Water, towels, green room requirements..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Save / Cancel */}
      <View style={styles.buttonRow}>
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.saveButton, { backgroundColor: tint }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveText}>Save Rider</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 4, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multiline: { minHeight: 80 },
  equipmentItem: {
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
    backgroundColor: "transparent",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "500" },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
