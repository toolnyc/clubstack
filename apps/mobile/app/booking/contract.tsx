import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  Share,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import type {
  Contract,
  ContractClause,
  ContractStatus,
  SignatureConfig,
} from "@clubstack/shared";
import {
  getContract,
  createContract,
  updateClause,
  updateSignatureConfig,
  sendContractForSignature,
} from "@/lib/api";
import { ClauseRow } from "@/components/contract/clause-row";
import { ContractStatusBadge } from "@/components/contract/contract-status-badge";

const SIG_CONFIG_LABELS: Record<SignatureConfig, string> = {
  agency_only: "Agency Only",
  agency_and_artist: "Agency + Artist",
};

export default function ContractScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [noContract, setNoContract] = useState(false);

  const loadContract = useCallback(async () => {
    if (!bookingId) return;
    const { data } = await getContract(bookingId);
    if (data) {
      setContract(data.contract);
      setClauses(data.clauses);
      setNoContract(false);
    } else {
      setNoContract(true);
    }
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadContract().finally(() => setLoading(false));
    }, [loadContract])
  );

  const handleCreate = async () => {
    if (!bookingId) return;
    setCreating(true);
    const { data, error } = await createContract(bookingId);
    if (error) {
      Alert.alert("Error", error);
    } else if (data) {
      setContract(data.contract);
      setClauses(data.clauses);
      setNoContract(false);
    }
    setCreating(false);
  };

  const handleToggleClause = async (clauseId: string, enabled: boolean) => {
    if (!bookingId) return;
    // Optimistic
    setClauses((prev) =>
      prev.map((c) => (c.id === clauseId ? { ...c, is_enabled: enabled } : c))
    );
    const { error } = await updateClause(bookingId, clauseId, {
      is_enabled: enabled,
    });
    if (error) {
      // Revert
      setClauses((prev) =>
        prev.map((c) =>
          c.id === clauseId ? { ...c, is_enabled: !enabled } : c
        )
      );
    }
  };

  const handleContentChange = async (clauseId: string, content: string) => {
    if (!bookingId) return;
    await updateClause(bookingId, clauseId, { content });
    setClauses((prev) =>
      prev.map((c) => (c.id === clauseId ? { ...c, content } : c))
    );
  };

  const handleConfigChange = async () => {
    if (!bookingId || !contract) return;
    const newConfig: SignatureConfig =
      contract.signature_config === "agency_only"
        ? "agency_and_artist"
        : "agency_only";

    setContract({ ...contract, signature_config: newConfig });
    const { error } = await updateSignatureConfig(bookingId, newConfig);
    if (error) {
      setContract({ ...contract });
    }
  };

  const handleSend = async () => {
    if (!bookingId) return;
    Alert.alert(
      "Send for Signature",
      "This will mark the contract as sent and generate a signing link. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            setSending(true);
            const { data, error } = await sendContractForSignature(bookingId);
            if (error) {
              Alert.alert("Error", error);
            } else if (data) {
              setContract((prev) =>
                prev ? { ...prev, status: "sent" } : prev
              );
              // Offer to share signing link
              await Share.share({
                message: `Sign the contract: ${data.signingUrl}`,
                url: data.signingUrl,
              });
            }
            setSending(false);
          },
        },
      ]
    );
  };

  const handleShareLink = async () => {
    if (!contract) return;
    const baseUrl =
      process.env.EXPO_PUBLIC_APP_URL ?? "https://clubstack.studio";
    const url = `${baseUrl}/sign/${(contract as Contract & { signing_token?: string }).signing_token}`;
    await Share.share({ message: `Sign the contract: ${url}`, url });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  // No contract state
  if (noContract || !contract) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No contract yet</Text>
        <Text style={styles.emptySubtext}>
          Create a contract to formalize this booking
        </Text>
        <Pressable
          style={styles.createButton}
          onPress={handleCreate}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.createButtonText}>Create Contract</Text>
          )}
        </Pressable>
      </View>
    );
  }

  const isDraft = contract.status === "draft";
  const displayClauses = isDraft
    ? clauses
    : clauses.filter((c) => c.is_enabled);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Contract</Text>
          <ContractStatusBadge status={contract.status as ContractStatus} />
        </View>

        {/* Signature Config (draft only) */}
        {isDraft && (
          <Pressable style={styles.configRow} onPress={handleConfigChange}>
            <Text style={styles.configLabel}>Signers Required</Text>
            <Text style={styles.configValue}>
              {SIG_CONFIG_LABELS[contract.signature_config as SignatureConfig]}
            </Text>
          </Pressable>
        )}

        {/* Clauses */}
        <Text style={styles.sectionTitle}>Clauses</Text>
        {displayClauses.map((clause) => (
          <ClauseRow
            key={clause.id}
            clause={clause}
            readOnly={!isDraft}
            onToggle={handleToggleClause}
            onContentChange={handleContentChange}
          />
        ))}

        {/* Actions */}
        {isDraft && (
          <Pressable
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send for Signature</Text>
            )}
          </Pressable>
        )}

        {contract.status === "sent" && (
          <Pressable style={styles.shareButton} onPress={handleShareLink}>
            <Text style={styles.shareButtonText}>Share Signing Link</Text>
          </Pressable>
        )}

        {contract.status === "signed" && (
          <View style={styles.signedBanner}>
            <Text style={styles.signedText}>Contract Signed</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#444",
    marginBottom: 24,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#00e5cc",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  configRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  configLabel: {
    fontSize: 13,
    color: "#888",
  },
  configValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00e5cc",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sendButton: {
    backgroundColor: "#00e5cc",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  shareButton: {
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  signedBanner: {
    backgroundColor: "#0a2a2a",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  signedText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#00e5cc",
  },
});
