import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { FieldVisibility, FieldVisibilityLevel } from "@clubstack/shared";

import { Text, View, useThemeColor } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";
import { useDJProfile } from "@/lib/use-dj-profile";
import { pickAndUploadAvatar, updateFieldVisibility } from "@/lib/dj-profile";

const GENRE_PRESETS = [
  "House",
  "Techno",
  "Drum & Bass",
  "Disco",
  "Garage",
  "Minimal",
  "Trance",
  "Breaks",
  "Ambient",
  "Dubstep",
  "Jungle",
  "Electro",
  "Afro House",
  "Deep House",
  "Tech House",
  "Progressive",
  "Downtempo",
  "UK Garage",
  "Grime",
  "Hip-Hop",
];

const VISIBILITY_OPTIONS: { label: string; value: FieldVisibilityLevel }[] = [
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
  { label: "Agent Only", value: "agent-only" },
];

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { djProfile, save, refresh } = useDJProfile();
  const router = useRouter();
  const tint = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  const [name, setName] = useState(djProfile?.name ?? "");
  const [bio, setBio] = useState(djProfile?.bio ?? "");
  const [location, setLocation] = useState(djProfile?.location ?? "");
  const [rateMin, setRateMin] = useState(djProfile?.rate_min?.toString() ?? "");
  const [rateMax, setRateMax] = useState(djProfile?.rate_max?.toString() ?? "");
  const [soundcloudUrl, setSoundcloudUrl] = useState(
    djProfile?.soundcloud_url ?? ""
  );
  const [instagramUrl, setInstagramUrl] = useState(
    djProfile?.instagram_url ?? ""
  );
  const [genres, setGenres] = useState<string[]>(djProfile?.genres ?? []);
  const [visibility, setVisibility] = useState<FieldVisibility>(
    djProfile?.field_visibility ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your DJ name.");
      return;
    }

    setSaving(true);
    try {
      await save({
        name: name.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
        rate_min: rateMin ? Number(rateMin) : null,
        rate_max: rateMax ? Number(rateMax) : null,
        soundcloud_url: soundcloudUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        genres: genres.length > 0 ? genres : null,
      });

      // Save visibility separately
      if (djProfile?.id) {
        await updateFieldVisibility(djProfile.id, visibility);
      }

      router.back();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to save profile"
      );
    } finally {
      setSaving(false);
    }
  }, [
    name,
    bio,
    location,
    rateMin,
    rateMax,
    soundcloudUrl,
    instagramUrl,
    genres,
    visibility,
    djProfile?.id,
    save,
    router,
  ]);

  const handleAvatarPress = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      await pickAndUploadAvatar(user.id);
      await refresh();
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const setFieldVisibility = (
    field: keyof FieldVisibility,
    level: FieldVisibilityLevel
  ) => {
    setVisibility((prev) => ({ ...prev, [field]: level }));
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <Pressable onPress={handleAvatarPress} style={styles.avatarContainer}>
        {uploadingAvatar ? (
          <View style={styles.avatarPlaceholder}>
            <ActivityIndicator color={tint} />
          </View>
        ) : djProfile?.avatar_url ? (
          <View>
            <Image
              source={{ uri: djProfile.avatar_url }}
              style={styles.avatar}
            />
            <View style={styles.avatarOverlay}>
              <FontAwesome name="camera" size={16} color="#fff" />
            </View>
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <FontAwesome name="camera" size={32} color="#999" />
            <Text style={styles.avatarHint}>Add Photo</Text>
          </View>
        )}
      </Pressable>

      {/* Basic Info */}
      <Text style={styles.sectionTitle}>Basic Info</Text>

      <Text style={styles.label}>DJ Name *</Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={name}
        onChangeText={setName}
        placeholder="Your DJ name"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={location}
        onChangeText={setLocation}
        placeholder="City, Country"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.multiline, { color: textColor }]}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell venues and promoters about yourself"
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Rates */}
      <Text style={styles.sectionTitle}>Rates</Text>
      <View style={styles.rateRow}>
        <View style={styles.rateField}>
          <Text style={styles.label}>Min ($)</Text>
          <TextInput
            style={[styles.input, { color: textColor }]}
            value={rateMin}
            onChangeText={setRateMin}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.rateField}>
          <Text style={styles.label}>Max ($)</Text>
          <TextInput
            style={[styles.input, { color: textColor }]}
            value={rateMax}
            onChangeText={setRateMax}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Social Links */}
      <Text style={styles.sectionTitle}>Social Links</Text>

      <Text style={styles.label}>SoundCloud URL</Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={soundcloudUrl}
        onChangeText={setSoundcloudUrl}
        placeholder="https://soundcloud.com/yourname"
        placeholderTextColor="#999"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Instagram URL</Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={instagramUrl}
        onChangeText={setInstagramUrl}
        placeholder="https://instagram.com/yourname"
        placeholderTextColor="#999"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Genres */}
      <Text style={styles.sectionTitle}>Genres</Text>
      <View style={styles.genreGrid}>
        {GENRE_PRESETS.map((genre) => {
          const selected = genres.includes(genre);
          return (
            <Pressable
              key={genre}
              onPress={() => toggleGenre(genre)}
              style={[styles.genreChip, selected && { backgroundColor: tint }]}
            >
              <Text style={[styles.genreText, selected && { color: "#fff" }]}>
                {genre}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Visibility */}
      <Text style={styles.sectionTitle}>Privacy</Text>
      <Text style={styles.hint}>
        Control who can see each section of your profile
      </Text>

      {(
        [
          ["rate", "Rates"],
          ["location", "Location"],
          ["bio", "Bio"],
          ["social_links", "Social Links"],
          ["press_kit", "Press Kit"],
          ["rider", "Technical Rider"],
          ["calendar", "Availability"],
        ] as const
      ).map(([field, label]) => (
        <View key={field} style={styles.visibilityRow}>
          <Text style={styles.visibilityLabel}>{label}</Text>
          <View style={styles.visibilityOptions}>
            {VISIBILITY_OPTIONS.map((opt) => {
              const active = (visibility[field] ?? "public") === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setFieldVisibility(field, opt.value)}
                  style={[
                    styles.visibilityChip,
                    active && { backgroundColor: tint },
                  ]}
                >
                  <Text
                    style={[
                      styles.visibilityChipText,
                      active && { color: "#fff" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

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
            <Text style={styles.saveText}>Save Profile</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  avatarContainer: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: { fontSize: 11, color: "#999", marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 4, marginTop: 12 },
  hint: { fontSize: 13, color: "#999", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multiline: { minHeight: 100 },
  rateRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "transparent",
  },
  rateField: { flex: 1, backgroundColor: "transparent" },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#e8e8e8",
  },
  genreText: { fontSize: 13 },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  visibilityLabel: { fontSize: 14, flex: 1 },
  visibilityOptions: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "transparent",
  },
  visibilityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  visibilityChipText: { fontSize: 11, fontWeight: "500" },
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
