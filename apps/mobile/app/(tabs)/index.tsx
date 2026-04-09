import { StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Text, View, useThemeColor } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";

export default function HomeScreen() {
  const { profile } = useAuth();
  const tint = useThemeColor({}, "tint");

  return (
    <View style={styles.container}>
      <FontAwesome name="headphones" size={48} color={tint} />
      <Text style={styles.title}>
        Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}
      </Text>
      <Text style={styles.subtitle}>Your dashboard is coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
  },
});
