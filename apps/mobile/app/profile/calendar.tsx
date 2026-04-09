import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useFocusEffect, Stack } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as AuthSession from "expo-auth-session";

import { Text, View, useThemeColor } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";
import {
  getConnectionStatus,
  getAvailability,
  connectMobile,
  disconnectCalendar,
  blockDate,
  unblockDate,
  type CalendarConnectionStatus,
  type DayStatus,
} from "@/lib/calendar";

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// ── Helpers ──

function getMonthGridDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  const firstDay = days[0].getDay();
  const lastDay = days[days.length - 1].getDay();

  const padStart: Date[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    padStart.push(new Date(year, month, -i));
  }

  const padEnd: Date[] = [];
  for (let i = 1; i <= 6 - lastDay; i++) {
    padEnd.push(new Date(year, month + 1, i));
  }

  return [...padStart, ...days, ...padEnd];
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Screen ──

export default function CalendarScreen() {
  const { user } = useAuth();
  const tint = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  const [connection, setConnection] = useState<CalendarConnectionStatus | null>(
    null
  );
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Month navigation
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "clubstack" });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID!,
      scopes: [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.freebusy",
      ],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
    discovery
  );

  // Load data on focus
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [conn, avail] = await Promise.all([
        getConnectionStatus(),
        getAvailability(
          toDateString(new Date(viewYear, viewMonth, 1)),
          toDateString(new Date(viewYear, viewMonth + 1, 0))
        ),
      ]);
      setConnection(conn);
      setDayStatuses(avail);
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Handle OAuth response
  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const result = await promptAsync();
      if (result.type === "success" && result.params.code) {
        const { error } = await connectMobile(result.params.code, redirectUri);
        if (error) {
          Alert.alert("Connection Failed", error);
        } else {
          await loadData();
        }
      }
    } finally {
      setConnecting(false);
    }
  }, [promptAsync, redirectUri, loadData]);

  const handleDisconnect = useCallback(async () => {
    Alert.alert(
      "Disconnect Calendar",
      "Your synced availability will be removed. Manual blocks will remain.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await disconnectCalendar();
            await loadData();
          },
        },
      ]
    );
  }, [loadData]);

  const handleDayPress = useCallback(
    async (dateStr: string) => {
      const existing = dayStatuses.find((d) => d.date === dateStr);

      // Can't unblock Google-synced busy days
      if (existing?.status === "busy") return;

      if (existing?.status === "blocked") {
        await unblockDate(dateStr);
      } else {
        await blockDate(dateStr);
      }

      // Refresh availability
      const avail = await getAvailability(
        toDateString(new Date(viewYear, viewMonth, 1)),
        toDateString(new Date(viewYear, viewMonth + 1, 0))
      );
      setDayStatuses(avail);
    },
    [dayStatuses, viewYear, viewMonth]
  );

  const statusMap = useMemo(() => {
    const map = new Map<string, DayStatus["status"]>();
    for (const d of dayStatuses) {
      map.set(d.date, d.status);
    }
    return map;
  }, [dayStatuses]);

  const gridDays = useMemo(
    () => getMonthGridDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const todayStr = toDateString(new Date());

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  if (loading && !connection) {
    return (
      <>
        <Stack.Screen options={{ title: "Availability" }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tint} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Availability" }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Connection Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome name="google" size={20} color={tint} />
            <Text style={styles.cardTitle}>Google Calendar</Text>
          </View>

          {connection?.connected ? (
            <>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        connection.syncStatus === "error"
                          ? "#e74c3c"
                          : "#2ecc71",
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {connection.syncStatus === "error"
                    ? "Sync error"
                    : connection.syncStatus === "revoked"
                      ? "Access revoked"
                      : "Connected"}
                </Text>
                {connection.lastSyncedAt && (
                  <Text style={styles.syncTime}>
                    Synced {formatRelativeTime(connection.lastSyncedAt)}
                  </Text>
                )}
              </View>
              {connection.syncError && (
                <Text style={styles.errorText}>{connection.syncError}</Text>
              )}
              <Pressable
                style={styles.disconnectButton}
                onPress={handleDisconnect}
              >
                <Text style={styles.disconnectText}>Disconnect</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.body}>
                Sync your Google Calendar to show busy days automatically.
              </Text>
              <Pressable
                style={[styles.connectButton, { backgroundColor: tint }]}
                onPress={handleConnect}
                disabled={!request || connecting}
              >
                {connecting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.connectText}>Connect Calendar</Text>
                )}
              </Pressable>
            </>
          )}
        </View>

        {/* Month Grid */}
        <View style={styles.card}>
          {/* Month Nav */}
          <View style={styles.monthNav}>
            <Pressable onPress={prevMonth} hitSlop={12}>
              <FontAwesome name="chevron-left" size={16} color={textColor} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {formatMonthYear(viewYear, viewMonth)}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={12}>
              <FontAwesome name="chevron-right" size={16} color={textColor} />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day, i) => (
              <View key={`${day}-${i}`} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Day cells */}
          <View style={styles.gridContainer}>
            {gridDays.map((date) => {
              const dateStr = toDateString(date);
              const inMonth = date.getMonth() === viewMonth;
              const isToday = dateStr === todayStr;
              const status = statusMap.get(dateStr);

              return (
                <Pressable
                  key={dateStr}
                  style={styles.dayCell}
                  onPress={() => inMonth && handleDayPress(dateStr)}
                  disabled={!inMonth}
                >
                  <View
                    style={[
                      styles.dayInner,
                      isToday && { borderColor: tint, borderWidth: 1.5 },
                      status === "busy" && styles.dayBusy,
                      status === "blocked" && styles.dayBlocked,
                      !inMonth && styles.dayOutside,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        !inMonth && styles.dayNumberOutside,
                        (status === "busy" || status === "blocked") &&
                          styles.dayNumberActive,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.dayBusy]} />
              <Text style={styles.legendText}>Synced busy</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.dayBlocked]} />
              <Text style={styles.legendText}>Manually blocked</Text>
            </View>
          </View>

          <Text style={styles.hint}>Tap a date to block or unblock it</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: { fontSize: 14, fontWeight: "500" },
  syncTime: { fontSize: 12, color: "#999", marginLeft: "auto" },
  errorText: { fontSize: 12, color: "#e74c3c", marginTop: 4 },
  body: { fontSize: 14, color: "#666", lineHeight: 20 },
  connectButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  connectText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  disconnectButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  disconnectText: { color: "#e74c3c", fontSize: 14 },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  monthTitle: { fontSize: 16, fontWeight: "600" },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    backgroundColor: "transparent",
  },
  weekdayText: { fontSize: 12, color: "#999", fontWeight: "500" },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "transparent",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 2,
  },
  dayInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  dayBusy: { backgroundColor: "#e74c3c" },
  dayBlocked: { backgroundColor: "#f39c12" },
  dayOutside: { opacity: 0.3 },
  dayNumber: { fontSize: 14 },
  dayNumberOutside: { color: "#999" },
  dayNumberActive: { color: "#fff", fontWeight: "600" },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    backgroundColor: "transparent",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "transparent",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: { fontSize: 12, color: "#666" },
  hint: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});
