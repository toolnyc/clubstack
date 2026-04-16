import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { BookingStatus } from "@clubstack/shared";
import type { PaymentRecord } from "@/lib/api";
import { chargeDeposit, chargeBalance } from "@/lib/api";

interface PaymentStatusCardProps {
  bookingId: string;
  bookingStatus: BookingStatus;
  depositPct: number;
  payments: PaymentRecord[];
  /** True if the current user is the payer */
  isPayer: boolean;
  onPaymentComplete: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  succeeded: "#2ecc71",
  processing: "#f39c12",
  failed: "#e74c3c",
  pending: "#888",
  refunded: "#999",
};

export function PaymentStatusCard({
  bookingId,
  bookingStatus,
  depositPct,
  payments,
  isPayer,
  onPaymentComplete,
}: PaymentStatusCardProps) {
  const [charging, setCharging] = useState(false);

  const depositPayment = payments.find((p) => p.type === "deposit");
  const balancePayment = payments.find((p) => p.type === "balance");

  const showDepositButton =
    isPayer && bookingStatus === "signed" && !depositPayment;
  const showBalanceButton =
    isPayer && bookingStatus === "deposit_paid" && !balancePayment;

  const handleCharge = async (type: "deposit" | "balance") => {
    const action = type === "deposit" ? "Pay Deposit" : "Pay Balance";
    Alert.alert(action, `Charge the ${type} to your saved payment method?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          setCharging(true);
          const fn = type === "deposit" ? chargeDeposit : chargeBalance;
          const { error } = await fn(bookingId);
          setCharging(false);
          if (error) {
            Alert.alert("Payment failed", error);
          } else {
            onPaymentComplete();
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Payments</Text>

      {/* Deposit Row */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.label}>Deposit ({depositPct}%)</Text>
          {depositPayment ? (
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      STATUS_COLORS[depositPayment.status] ?? "#888",
                  },
                ]}
              />
              <Text style={styles.statusText}>
                ${depositPayment.amount.toFixed(2)} — {depositPayment.status}
              </Text>
            </View>
          ) : (
            <Text style={styles.pendingText}>Not yet paid</Text>
          )}
        </View>
        {showDepositButton && (
          <Pressable
            style={styles.chargeButton}
            onPress={() => handleCharge("deposit")}
            disabled={charging}
          >
            {charging ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.chargeButtonText}>Pay</Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Balance Row */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.label}>Balance ({100 - depositPct}%)</Text>
          {balancePayment ? (
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      STATUS_COLORS[balancePayment.status] ?? "#888",
                  },
                ]}
              />
              <Text style={styles.statusText}>
                ${balancePayment.amount.toFixed(2)} — {balancePayment.status}
              </Text>
            </View>
          ) : (
            <Text style={styles.pendingText}>Not yet paid</Text>
          )}
        </View>
        {showBalanceButton && (
          <Pressable
            style={styles.chargeButton}
            onPress={() => handleCharge("balance")}
            disabled={charging}
          >
            {charging ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.chargeButtonText}>Pay</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  rowLeft: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    color: "#888",
  },
  pendingText: {
    fontSize: 13,
    color: "#555",
    fontStyle: "italic",
  },
  chargeButton: {
    backgroundColor: "#00e5cc",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  chargeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
});
