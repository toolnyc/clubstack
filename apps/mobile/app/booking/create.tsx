import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBooking } from "@/lib/api";
import {
  StepArtists,
  type ArtistEntry,
} from "@/components/booking/step-artists";
import { StepDates, type DateEntry } from "@/components/booking/step-dates";
import { StepEvent, type EventDetails } from "@/components/booking/step-event";
import { StepReview } from "@/components/booking/step-review";

const STEPS = ["Artists", "Dates", "Event", "Review"] as const;

export default function CreateBookingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [artists, setArtists] = useState<ArtistEntry[]>([]);
  const [dates, setDates] = useState<DateEntry[]>([{ date: "" }]);
  const [event, setEvent] = useState<EventDetails>({});

  const canNext = () => {
    switch (step) {
      case 0:
        return artists.length > 0;
      case 1:
        return dates.length > 0 && dates.every((d) => d.date.length === 10);
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const { data, error } = await createBooking({
      booking: {
        payer_type: event.payer_type,
        notes: event.notes,
      },
      dates: dates.map((d) => ({
        date: d.date,
        set_time: d.set_time || undefined,
        load_in_time: d.load_in_time || undefined,
        event_name: d.event_name || undefined,
      })),
      artists: artists.map((a) => ({
        dj_profile_id: a.dj_profile_id,
        fee: a.fee,
        commission_pct: a.commission_pct,
        payment_split_pct: a.payment_split_pct,
      })),
      costs: [],
    });

    setSubmitting(false);

    if (error) {
      Alert.alert("Error", error);
      return;
    }

    if (data?.bookingId) {
      router.replace(`/booking/${data.bookingId}`);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepArtists artists={artists} onChange={setArtists} />;
      case 1:
        return <StepDates dates={dates} onChange={setDates} />;
      case 2:
        return <StepEvent event={event} onChange={setEvent} />;
      case 3:
        return <StepReview artists={artists} dates={dates} event={event} />;
      default:
        return null;
    }
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Progress bar */}
        <View style={styles.progressRow}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.progressItem}>
              <View
                style={[
                  styles.progressDot,
                  i <= step && styles.progressDotActive,
                ]}
              />
              <Text
                style={[
                  styles.progressLabel,
                  i === step && styles.progressLabelActive,
                ]}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Step content */}
        <View style={styles.stepContent}>{renderStep()}</View>

        {/* Navigation */}
        <View style={styles.navRow}>
          {step > 0 ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : (
            <View />
          )}

          <Pressable
            onPress={isLastStep ? handleSubmit : handleNext}
            disabled={!canNext() || submitting}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.pressed,
              (!canNext() || submitting) && styles.disabled,
            ]}
          >
            <Text style={styles.nextText}>
              {submitting
                ? "Creating..."
                : isLastStep
                  ? "Create Booking"
                  : "Next"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  flex: {
    flex: 1,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#222",
  },
  progressItem: {
    alignItems: "center",
    gap: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333",
  },
  progressDotActive: {
    backgroundColor: "#fff",
  },
  progressLabel: {
    fontSize: 11,
    color: "#555",
    fontWeight: "600",
  },
  progressLabelActive: {
    color: "#fff",
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#222",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backText: {
    color: "#888",
    fontSize: 15,
    fontWeight: "600",
  },
  nextButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.3,
  },
});
