import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { BookingTravel, TravelType } from "@clubstack/shared";

const TRAVEL_TYPES: { value: TravelType; label: string }[] = [
  { value: "flight", label: "Flight" },
  { value: "hotel", label: "Hotel" },
  { value: "ground_transport", label: "Ground" },
];

interface TravelFormModalProps {
  visible: boolean;
  existing?: BookingTravel | null;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

export function TravelFormModal({
  visible,
  existing,
  onSave,
  onClose,
}: TravelFormModalProps) {
  const [type, setType] = useState<TravelType>(existing?.type ?? "flight");
  const [cost, setCost] = useState(existing?.cost ? String(existing.cost) : "");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  // Flight fields
  const [airline, setAirline] = useState(existing?.airline ?? "");
  const [flightNumber, setFlightNumber] = useState(
    existing?.flight_number ?? ""
  );
  const [departureAirport, setDepartureAirport] = useState(
    existing?.departure_airport ?? ""
  );
  const [arrivalAirport, setArrivalAirport] = useState(
    existing?.arrival_airport ?? ""
  );

  // Hotel fields
  const [hotelName, setHotelName] = useState(existing?.hotel_name ?? "");
  const [hotelAddress, setHotelAddress] = useState(
    existing?.hotel_address ?? ""
  );
  const [checkIn, setCheckIn] = useState(existing?.check_in ?? "");
  const [checkOut, setCheckOut] = useState(existing?.check_out ?? "");

  // Ground transport
  const [transportDetails, setTransportDetails] = useState(
    existing?.transport_details ?? ""
  );

  const handleSave = () => {
    const data: Record<string, unknown> = {
      type,
      notes: notes || undefined,
      cost: cost ? parseFloat(cost) : undefined,
    };

    if (type === "flight") {
      data.airline = airline || undefined;
      data.flight_number = flightNumber || undefined;
      data.departure_airport = departureAirport || undefined;
      data.arrival_airport = arrivalAirport || undefined;
    } else if (type === "hotel") {
      data.hotel_name = hotelName || undefined;
      data.hotel_address = hotelAddress || undefined;
      data.check_in = checkIn || undefined;
      data.check_out = checkOut || undefined;
    } else if (type === "ground_transport") {
      data.transport_details = transportDetails || undefined;
    }

    onSave(data);
  };

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
            {existing ? "Edit Travel" : "Add Travel"}
          </Text>
          <Pressable onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {/* Type selector */}
          <View style={styles.typeRow}>
            {TRAVEL_TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                style={[styles.typeChip, type === t.value && styles.typeActive]}
              >
                <Text
                  style={[
                    styles.typeText,
                    type === t.value && styles.typeTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Type-specific fields */}
          {type === "flight" && (
            <>
              <Text style={styles.label}>Airline</Text>
              <TextInput
                style={styles.input}
                value={airline}
                onChangeText={setAirline}
                placeholder="e.g. Delta"
                placeholderTextColor="#555"
              />
              <Text style={styles.label}>Flight Number</Text>
              <TextInput
                style={styles.input}
                value={flightNumber}
                onChangeText={setFlightNumber}
                placeholder="e.g. DL1234"
                placeholderTextColor="#555"
              />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>From</Text>
                  <TextInput
                    style={styles.input}
                    value={departureAirport}
                    onChangeText={setDepartureAirport}
                    placeholder="JFK"
                    placeholderTextColor="#555"
                    autoCapitalize="characters"
                    maxLength={10}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>To</Text>
                  <TextInput
                    style={styles.input}
                    value={arrivalAirport}
                    onChangeText={setArrivalAirport}
                    placeholder="LAX"
                    placeholderTextColor="#555"
                    autoCapitalize="characters"
                    maxLength={10}
                  />
                </View>
              </View>
            </>
          )}

          {type === "hotel" && (
            <>
              <Text style={styles.label}>Hotel Name</Text>
              <TextInput
                style={styles.input}
                value={hotelName}
                onChangeText={setHotelName}
                placeholder="e.g. W Hotel"
                placeholderTextColor="#555"
              />
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={hotelAddress}
                onChangeText={setHotelAddress}
                placeholder="123 Main St"
                placeholderTextColor="#555"
              />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Check-in</Text>
                  <TextInput
                    style={styles.input}
                    value={checkIn}
                    onChangeText={setCheckIn}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#555"
                    maxLength={10}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Check-out</Text>
                  <TextInput
                    style={styles.input}
                    value={checkOut}
                    onChangeText={setCheckOut}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#555"
                    maxLength={10}
                  />
                </View>
              </View>
            </>
          )}

          {type === "ground_transport" && (
            <>
              <Text style={styles.label}>Details</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={transportDetails}
                onChangeText={setTransportDetails}
                placeholder="e.g. Car service from airport to venue"
                placeholderTextColor="#555"
                multiline
                numberOfLines={3}
              />
            </>
          )}

          {/* Shared fields */}
          <Text style={styles.label}>Cost ($)</Text>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            placeholder="0.00"
            placeholderTextColor="#555"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            placeholderTextColor="#555"
            multiline
            numberOfLines={3}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
  form: {
    padding: 16,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#111",
    alignItems: "center",
  },
  typeActive: {
    backgroundColor: "#fff",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  typeTextActive: {
    color: "#000",
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  bottomSpacer: {
    height: 40,
  },
});
