import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import type { ContractClause } from "@clubstack/shared";

interface ClauseRowProps {
  clause: ContractClause;
  readOnly: boolean;
  onToggle: (clauseId: string, enabled: boolean) => void;
  onContentChange: (clauseId: string, content: string) => void;
}

export function ClauseRow({
  clause,
  readOnly,
  onToggle,
  onContentChange,
}: ClauseRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [localContent, setLocalContent] = useState(clause.content);

  const handleBlur = () => {
    if (localContent !== clause.content) {
      onContentChange(clause.id, localContent);
    }
  };

  return (
    <View style={[styles.container, !clause.is_enabled && styles.disabled]}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{clause.title}</Text>
          <Text style={styles.chevron}>{expanded ? "▼" : "▶"}</Text>
        </View>
        {!readOnly && (
          <Switch
            value={clause.is_enabled}
            onValueChange={(val) => onToggle(clause.id, val)}
            trackColor={{ false: "#333", true: "#0a4a4a" }}
            thumbColor={clause.is_enabled ? "#00e5cc" : "#666"}
          />
        )}
      </Pressable>

      {expanded && (
        <View style={styles.contentContainer}>
          {readOnly ? (
            <Text style={styles.contentText}>{clause.content}</Text>
          ) : (
            <TextInput
              style={styles.contentInput}
              value={localContent}
              onChangeText={setLocalContent}
              onBlur={handleBlur}
              multiline
              editable={clause.is_enabled}
              placeholderTextColor="#444"
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  chevron: {
    fontSize: 10,
    color: "#555",
    marginLeft: 8,
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  contentText: {
    fontSize: 13,
    color: "#aaa",
    lineHeight: 20,
  },
  contentInput: {
    fontSize: 13,
    color: "#ccc",
    lineHeight: 20,
    backgroundColor: "#0a0a0a",
    borderRadius: 6,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
});
