import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { EquipmentRequirements, TechnicalRider } from "@clubstack/shared";

import { Text, View, useThemeColor } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";
import { useDJProfile } from "@/lib/use-dj-profile";
import { getRider } from "@/lib/technical-rider";

const EQUIPMENT_LABELS: {
  key: keyof EquipmentRequirements;
  label: string;
  modelKey?: keyof EquipmentRequirements;
}[] = [
  { key: "cdjs", label: "CDJs", modelKey: "cdj_model" },
  { key: "turntables", label: "Turntables", modelKey: "turntable_model" },
  { key: "mixer", label: "Mixer", modelKey: "mixer_model" },
  { key: "needles_provided", label: "Needles Provided" },
  { key: "usb_required", label: "USB Required" },
  { key: "laptop_stand", label: "Laptop Stand" },
];

export default function RiderViewScreen() {
  const { djProfile } = useDJProfile();
  const router = useRouter();
  const tint = useThemeColor({}, "tint");
  const [rider, setRider] = useState<TechnicalRider | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!djProfile?.id) return;
      setLoading(true);
      getRider(djProfile.id)
        .then(setRider)
        .finally(() => setLoading(false));
    }, [djProfile?.id])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  // Empty state
  if (!rider) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="sliders" size={48} color="#ccc" />
        <Text style={styles.emptyTitle}>No Technical Rider</Text>
        <Text style={styles.emptySubtitle}>
          Add your equipment and hospitality requirements
        </Text>
        <Pressable
          style={[styles.ctaButton, { backgroundColor: tint }]}
          onPress={() => router.push("/profile/rider-edit")}
        >
          <Text style={styles.ctaText}>Add Your Rider</Text>
        </Pressable>
      </View>
    );
  }

  const equipment = rider.equipment;
  const activeEquipment = EQUIPMENT_LABELS.filter(
    (item) => equipment[item.key]
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Technical Rider</Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v{rider.version}</Text>
        </View>
      </View>

      {/* Equipment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equipment</Text>
        {activeEquipment.length > 0 ? (
          activeEquipment.map((item) => {
            const model = item.modelKey
              ? (equipment[item.modelKey] as string | undefined)
              : undefined;
            return (
              <View key={item.key} style={styles.equipmentRow}>
                <FontAwesome name="check" size={14} color={tint} />
                <Text style={styles.equipmentLabel}>{item.label}</Text>
                {model ? (
                  <Text style={styles.equipmentModel}>{model}</Text>
                ) : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.placeholder}>No equipment specified</Text>
        )}
        {equipment.other ? (
          <View style={styles.otherRow}>
            <Text style={styles.otherLabel}>Other:</Text>
            <Text style={styles.otherText}>{equipment.other}</Text>
          </View>
        ) : null}
      </View>

      {/* Booth Requirements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booth Requirements</Text>
        {rider.booth_monitors ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Monitors</Text>
            <Text style={styles.fieldValue}>{rider.booth_monitors}</Text>
          </View>
        ) : null}
        {rider.booth_requirements ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Setup</Text>
            <Text style={styles.fieldValue}>{rider.booth_requirements}</Text>
          </View>
        ) : null}
        {rider.power_requirements ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Power</Text>
            <Text style={styles.fieldValue}>{rider.power_requirements}</Text>
          </View>
        ) : null}
        {!rider.booth_monitors &&
          !rider.booth_requirements &&
          !rider.power_requirements && (
            <Text style={styles.placeholder}>
              No booth requirements specified
            </Text>
          )}
      </View>

      {/* Hospitality */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hospitality</Text>
        {rider.hospitality ? (
          <Text style={styles.body}>{rider.hospitality}</Text>
        ) : (
          <Text style={styles.placeholder}>No hospitality requirements</Text>
        )}
      </View>

      {/* Edit Button */}
      <Pressable
        style={[styles.editButton, { borderColor: tint }]}
        onPress={() => router.push("/profile/rider-edit")}
      >
        <FontAwesome name="pencil" size={16} color={tint} />
        <Text style={[styles.editText, { color: tint }]}>Edit Rider</Text>
      </Pressable>
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
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  title: { fontSize: 24, fontWeight: "bold" },
  versionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#e8e8e8",
  },
  versionText: { fontSize: 12, fontWeight: "600", color: "#666" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  equipmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    backgroundColor: "transparent",
  },
  equipmentLabel: { fontSize: 15, fontWeight: "500" },
  equipmentModel: { fontSize: 13, color: "#666", marginLeft: "auto" },
  otherRow: {
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  otherLabel: { fontSize: 13, fontWeight: "500", color: "#999" },
  otherText: { fontSize: 14, marginTop: 2 },
  fieldRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    backgroundColor: "transparent",
  },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: "#999" },
  fieldValue: { fontSize: 15, marginTop: 2 },
  body: { fontSize: 14, lineHeight: 20, color: "#666" },
  placeholder: { fontSize: 14, color: "#999", fontStyle: "italic" },
  emptyTitle: { fontSize: 20, fontWeight: "bold" },
  emptySubtitle: { fontSize: 14, color: "#999", textAlign: "center" },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  ctaText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  editText: { fontSize: 16, fontWeight: "600" },
});
