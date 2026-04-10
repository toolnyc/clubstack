import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor="#555"
          multiline
          maxLength={5000}
          editable={!disabled}
          returnKeyType="default"
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          style={[styles.sendButton, !text.trim() && styles.sendDisabled]}
        >
          <Text
            style={[styles.sendText, !text.trim() && styles.sendTextDisabled]}
          >
            Send
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#222",
    backgroundColor: "#000",
  },
  input: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#fff",
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#00e5cc",
  },
  sendDisabled: {
    backgroundColor: "#1a1a1a",
  },
  sendText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  sendTextDisabled: {
    color: "#555",
  },
});
