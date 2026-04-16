import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Text, View, useThemeColor } from "@/components/Themed";
import {
  createStripeConnect,
  getStripeConnectStatus,
  type StripeConnectStatus,
} from "@/lib/api";

const STATUS_CONFIG = {
  not_started: {
    icon: "credit-card" as const,
    label: "Not set up",
    color: "#999",
    description: "Set up your Stripe account to receive payments for gigs.",
  },
  pending: {
    icon: "clock-o" as const,
    label: "Pending verification",
    color: "#f39c12",
    description:
      "Stripe is reviewing your information. You can continue setup if needed.",
  },
  active: {
    icon: "check-circle" as const,
    label: "Active",
    color: "#2ecc71",
    description: "Your account is set up and ready to receive payments.",
  },
  restricted: {
    icon: "exclamation-triangle" as const,
    label: "Action required",
    color: "#e74c3c",
    description:
      "Stripe needs additional information. Tap below to complete setup.",
  },
};

export default function StripeSetupScreen() {
  const tint = useThemeColor({}, "tint");
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    const { data } = await getStripeConnectStatus();
    if (data) setStatus(data);
    setLoading(false);
  }, []);

  // Refresh status every time the screen gains focus (e.g., after returning from browser)
  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus])
  );

  const handleSetup = async () => {
    setLaunching(true);
    const { data, error } = await createStripeConnect();

    if (error || !data?.url) {
      Alert.alert("Error", error ?? "Could not start Stripe setup.");
      setLaunching(false);
      return;
    }

    await WebBrowser.openBrowserAsync(data.url, {
      dismissButtonStyle: "close",
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
    });

    // User returned from browser — refresh status
    setLaunching(false);
    fetchStatus();
  };

  if (loading && !status) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  const currentStatus = status?.status ?? "not_started";
  const config = STATUS_CONFIG[currentStatus];
  const showSetupButton = currentStatus !== "active";

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <FontAwesome name={config.icon} size={24} color={config.color} />
          <View style={styles.statusText}>
            <Text style={styles.statusLabel}>{config.label}</Text>
            <Text style={styles.statusDescription}>{config.description}</Text>
          </View>
        </View>
      </View>

      {/* Setup / Continue Button */}
      {showSetupButton && (
        <Pressable
          style={[styles.button, { backgroundColor: tint }]}
          onPress={handleSetup}
          disabled={launching}
        >
          {launching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <FontAwesome name="external-link" size={16} color="#fff" />
              <Text style={styles.buttonText}>
                {currentStatus === "not_started"
                  ? "Set up Stripe account"
                  : "Continue setup"}
              </Text>
            </>
          )}
        </Pressable>
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How payments work</Text>
        <View style={styles.infoRow}>
          <FontAwesome name="shield" size={14} color="#999" />
          <Text style={styles.infoText}>
            Payments are held in escrow until 48 hours after your gig
          </Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome name="dollar" size={14} color="#999" />
          <Text style={styles.infoText}>
            Funds are transferred directly to your bank account via Stripe
          </Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome name="lock" size={14} color="#999" />
          <Text style={styles.infoText}>
            Clubstack never stores your banking details
          </Text>
        </View>
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
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "transparent",
  },
  statusText: {
    flex: 1,
    backgroundColor: "transparent",
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoSection: {
    marginTop: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
