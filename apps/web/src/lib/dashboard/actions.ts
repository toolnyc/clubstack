"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  InvoiceStatus,
  AgencyArtistStatus,
  UserType,
} from "@clubstack/shared";

export interface UpcomingBooking {
  id: string;
  status: string;
  notes: string | null;
  venue_name: string | null;
  dates: { date: string; event_name: string | null }[];
  artists: { name: string }[];
}

export interface RecentInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  created_at: string;
  booking_id: string;
}

export interface ActionItem {
  type: "pending_invite" | "stale_draft";
  label: string;
  href: string;
}

export interface DashboardStats {
  activeBookings: number;
  rosterSize: number;
  revenueThisMonth: number;
}

export interface DashboardData {
  userType: UserType;
  displayName: string | null;
  upcomingBookings: UpcomingBooking[];
  recentInvoices: RecentInvoice[];
  calendarConnected: boolean;
  calendarId: string | null;
  stats: DashboardStats;
  actionItems: ActionItem[];
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const userType = profile.user_type as UserType;
  const now = new Date();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const todayStr = now.toISOString().split("T")[0];
  const futureStr = sevenDaysLater.toISOString().split("T")[0];

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [
    upcomingBookings,
    recentInvoices,
    calendarResult,
    rosterSize,
    actionItems,
    activeBookingResult,
    paidInvoicesResult,
  ] = await Promise.all([
    fetchUpcomingBookings(supabase, todayStr, futureStr),
    fetchRecentInvoices(supabase),
    supabase
      .from("calendar_connections")
      .select("id, calendar_id")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .single(),
    userType === "agency"
      ? fetchRosterSize(supabase, user.id)
      : Promise.resolve(0),
    userType === "agency"
      ? fetchActionItems(supabase, user.id)
      : Promise.resolve([]),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .not("status", "in", '("completed","cancelled")'),
    supabase
      .from("invoices")
      .select("total_amount")
      .eq("status", "paid")
      .gte("paid_at", monthStart),
  ]);

  const revenueThisMonth = (paidInvoicesResult.data ?? []).reduce(
    (sum, inv) => sum + Number(inv.total_amount),
    0
  );

  return {
    userType,
    displayName: profile.display_name,
    upcomingBookings,
    recentInvoices,
    calendarConnected: !!calendarResult.data,
    calendarId: calendarResult.data?.calendar_id ?? null,
    stats: {
      activeBookings: activeBookingResult.count ?? 0,
      rosterSize,
      revenueThisMonth,
    },
    actionItems,
  };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function fetchUpcomingBookings(
  supabase: Supabase,
  todayStr: string,
  futureStr: string
): Promise<UpcomingBooking[]> {
  const { data: upcomingDates } = await supabase
    .from("booking_dates")
    .select("booking_id, date, event_name")
    .gte("date", todayStr)
    .lte("date", futureStr)
    .order("date");

  if (!upcomingDates || upcomingDates.length === 0) return [];

  const bookingIds = [...new Set(upcomingDates.map((d) => d.booking_id))];

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, notes, venue:venues(name), booking_artists(dj_profile:dj_profiles(name))"
    )
    .in("id", bookingIds)
    .neq("status", "cancelled");

  if (!bookings) return [];

  return bookings.map((b) => {
    const booking = b as unknown as {
      id: string;
      status: string;
      notes: string | null;
      venue: { name: string } | null;
      booking_artists: { dj_profile: { name: string } | null }[];
    };

    const dates = upcomingDates
      .filter((d) => d.booking_id === booking.id)
      .map((d) => ({ date: d.date, event_name: d.event_name }));

    const artists = (booking.booking_artists ?? [])
      .filter((a) => a.dj_profile)
      .map((a) => ({ name: a.dj_profile!.name }));

    return {
      id: booking.id,
      status: booking.status,
      notes: booking.notes,
      venue_name: booking.venue?.name ?? null,
      dates,
      artists,
    };
  });
}

async function fetchRecentInvoices(
  supabase: Supabase
): Promise<RecentInvoice[]> {
  const { data } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, total_amount, currency, status, due_date, created_at, booking_id"
    )
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? []) as unknown as RecentInvoice[];
}

async function fetchRosterSize(
  supabase: Supabase,
  userId: string
): Promise<number> {
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!agency) return 0;

  const { count } = await supabase
    .from("agency_artists")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agency.id)
    .eq("status", "active" satisfies AgencyArtistStatus);

  return count ?? 0;
}

async function fetchActionItems(
  supabase: Supabase,
  userId: string
): Promise<ActionItem[]> {
  const items: ActionItem[] = [];

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (agency) {
    const { data: pendingInvites } = await supabase
      .from("agency_artists")
      .select("id, dj_profile:dj_profiles(name)")
      .eq("agency_id", agency.id)
      .eq("status", "pending" satisfies AgencyArtistStatus);

    for (const invite of pendingInvites ?? []) {
      const djProfile = invite.dj_profile as unknown as {
        name: string;
      } | null;
      items.push({
        type: "pending_invite",
        label: `${djProfile?.name ?? "Artist"} — invite pending`,
        href: "/roster",
      });
    }
  }

  // Stale draft bookings (created more than 3 days ago)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data: staleDrafts } = await supabase
    .from("bookings")
    .select("id")
    .eq("status", "draft")
    .lt("created_at", threeDaysAgo.toISOString());

  for (const draft of staleDrafts ?? []) {
    items.push({
      type: "stale_draft",
      label: "Draft booking needs attention",
      href: `/bookings/${draft.id}`,
    });
  }

  return items;
}
