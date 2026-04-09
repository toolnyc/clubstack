import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { FieldVisibilityLevel } from "@clubstack/shared";

import { Text, View, useThemeColor } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";
import { useDJProfile } from "@/lib/use-dj-profile";
import { getRiderSummary, pickAndUploadAvatar } from "@/lib/dj-profile";
import {
  getConnectionStatus,
  type CalendarConnectionStatus,
} from "@/lib/calendar";

export default function ProfileScreen() {
  const { profile, user } = useAuth();
  const { djProfile, isLoading, refresh } = useDJProfile();
  const router = useRouter();
  const tint = useThemeColor({}, "tint");
  const [riderSummary, setRiderSummary] = useState<{
    equipment_count: number;
    has_rider: boolean;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [calendarStatus, setCalendarStatus] =
    useState<CalendarConnectionStatus | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
      if (djProfile?.id) {
        getRiderSummary(djProfile.id).then(setRiderSummary);
      }
      getConnectionStatus().then(setCalendarStatus);
    }, [refresh, djProfile?.id])
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  // Non-DJ users see a simple profile card
  if (profile?.user_type !== "dj") {
    return (
      <View style={styles.centered}>
        <FontAwesome name="user" size={48} color={tint} />
        <Text style={styles.title}>{profile?.display_name ?? "Profile"}</Text>
        <Text style={styles.subtitle}>
          {profile?.user_type?.replace("_", " ")}
        </Text>
      </View>
    );
  }

  // DJ with no profile yet
  if (!djProfile) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="microphone" size={48} color={tint} />
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
          Set up your DJ profile to start getting booked
        </Text>
        <Pressable
          style={[styles.ctaButton, { backgroundColor: tint }]}
          onPress={() => router.push("/profile/edit")}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
      </View>
    );
  }

  const handleAvatarPress = async () => {
    if (!user) return;
    setUploading(true);
    try {
      await pickAndUploadAvatar(user.id);
      await refresh();
    } finally {
      setUploading(false);
    }
  };

  const visibilityIcon = (level?: FieldVisibilityLevel) => {
    if (level === "private") return "lock";
    if (level === "agent-only") return "briefcase";
    return null;
  };

  const vis = djProfile.field_visibility;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <Pressable onPress={handleAvatarPress} style={styles.avatarContainer}>
        {uploading ? (
          <View style={styles.avatarPlaceholder}>
            <ActivityIndicator color={tint} />
          </View>
        ) : djProfile.avatar_url ? (
          <Image source={{ uri: djProfile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <FontAwesome name="camera" size={32} color="#999" />
          </View>
        )}
        <Text style={styles.avatarHint}>Tap to change</Text>
      </Pressable>

      {/* Name + Location */}
      <Text style={styles.name}>{djProfile.name}</Text>
      {djProfile.location && (
        <View style={styles.row}>
          <FontAwesome name="map-marker" size={14} color="#999" />
          <Text style={styles.location}>{djProfile.location}</Text>
          {visibilityIcon(vis.location) && (
            <FontAwesome
              name={visibilityIcon(vis.location)!}
              size={12}
              color="#999"
            />
          )}
        </View>
      )}

      {/* Rate */}
      {(djProfile.rate_min || djProfile.rate_max) && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {djProfile.rate_min && djProfile.rate_max
              ? `$${djProfile.rate_min} – $${djProfile.rate_max}`
              : djProfile.rate_min
                ? `From $${djProfile.rate_min}`
                : `Up to $${djProfile.rate_max}`}
          </Text>
          {visibilityIcon(vis.rate) && (
            <FontAwesome
              name={visibilityIcon(vis.rate)!}
              size={10}
              color="#666"
            />
          )}
        </View>
      )}

      {/* Genres */}
      {djProfile.genres && djProfile.genres.length > 0 && (
        <View style={styles.genreRow}>
          {djProfile.genres.map((genre) => (
            <View key={genre} style={styles.genreChip}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bio */}
      {djProfile.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.body}>{djProfile.bio}</Text>
        </View>
      )}

      {/* Social Links */}
      {(djProfile.soundcloud_url || djProfile.instagram_url) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Links</Text>
          <View style={styles.linksRow}>
            {djProfile.soundcloud_url && (
              <View style={styles.linkChip}>
                <FontAwesome name="soundcloud" size={16} color={tint} />
                <Text style={styles.linkText}>SoundCloud</Text>
              </View>
            )}
            {djProfile.instagram_url && (
              <View style={styles.linkChip}>
                <FontAwesome name="instagram" size={16} color={tint} />
                <Text style={styles.linkText}>Instagram</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Press Kit */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Press Kit</Text>
        {djProfile.press_kit &&
        (djProfile.press_kit.mixes?.length ||
          djProfile.press_kit.photos?.length ||
          djProfile.press_kit.one_sheets?.length ||
          djProfile.press_kit.links?.length) ? (
          <View>
            {djProfile.press_kit.mixes?.map((f) => (
              <View key={f.url} style={styles.fileRow}>
                <FontAwesome name="music" size={14} color="#999" />
                <Text style={styles.fileName}>{f.name}</Text>
              </View>
            ))}
            {djProfile.press_kit.photos?.map((f) => (
              <View key={f.url} style={styles.fileRow}>
                <FontAwesome name="image" size={14} color="#999" />
                <Text style={styles.fileName}>{f.name}</Text>
              </View>
            ))}
            {djProfile.press_kit.one_sheets?.map((f) => (
              <View key={f.url} style={styles.fileRow}>
                <FontAwesome name="file-text" size={14} color="#999" />
                <Text style={styles.fileName}>{f.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.placeholder}>No press kit files yet</Text>
        )}
      </View>

      {/* Rider Summary Card */}
      <Pressable
        style={styles.card}
        onPress={() => router.push("/profile/rider")}
      >
        <View style={styles.cardHeader}>
          <FontAwesome name="sliders" size={18} color={tint} />
          <Text style={styles.cardTitle}>Technical Rider</Text>
          <FontAwesome
            name="chevron-right"
            size={14}
            color="#999"
            style={{ marginLeft: "auto" }}
          />
        </View>
        {riderSummary ? (
          <Text style={styles.body}>
            {riderSummary.equipment_count} equipment items configured
          </Text>
        ) : (
          <Text style={styles.placeholder}>
            Add your technical requirements
          </Text>
        )}
      </Pressable>

      {/* Calendar / Availability */}
      <Pressable
        style={styles.card}
        onPress={() => router.push("/profile/calendar")}
      >
        <View style={styles.cardHeader}>
          <FontAwesome name="calendar" size={18} color={tint} />
          <Text style={styles.cardTitle}>Availability</Text>
          <FontAwesome
            name="chevron-right"
            size={14}
            color="#999"
            style={{ marginLeft: "auto" }}
          />
        </View>
        {calendarStatus?.connected ? (
          <View style={styles.calendarStatus}>
            <View
              style={[
                styles.calendarDot,
                {
                  backgroundColor:
                    calendarStatus.syncStatus === "error"
                      ? "#e74c3c"
                      : "#2ecc71",
                },
              ]}
            />
            <Text style={styles.body}>
              {calendarStatus.syncStatus === "error"
                ? "Sync error"
                : "Calendar connected"}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Connect your calendar</Text>
        )}
      </Pressable>

      {/* Edit Button */}
      <Pressable
        style={[styles.editButton, { borderColor: tint }]}
        onPress={() => router.push("/profile/edit")}
      >
        <FontAwesome name="pencil" size={16} color={tint} />
        <Text style={[styles.editText, { color: tint }]}>Edit Profile</Text>
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
  avatarContainer: { alignItems: "center", marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: { fontSize: 12, color: "#999", marginTop: 4 },
  name: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  location: { fontSize: 14, color: "#999" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  badgeText: { fontSize: 14, fontWeight: "600" },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  genreChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#e8e8e8",
  },
  genreText: { fontSize: 12, color: "#666" },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 20, color: "#666" },
  linksRow: { flexDirection: "row", gap: 12 },
  linkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  linkText: { fontSize: 14 },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  fileName: { fontSize: 14 },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  placeholder: { fontSize: 14, color: "#999", fontStyle: "italic" },
  calendarStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  calendarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  editText: { fontSize: 16, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "#999", textTransform: "capitalize" },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  ctaText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
