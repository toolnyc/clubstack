export type UserType = "dj" | "agency" | "venue_contact" | "promoter";

export interface Profile {
  id: string;
  user_type: UserType;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export type BookingStatus =
  | "draft"
  | "contract_sent"
  | "signed"
  | "deposit_paid"
  | "balance_paid"
  | "completed";

export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: "google";
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  calendar_id: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarDay {
  date: string;
  status: "available" | "busy";
}

export interface DJProfile {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  rate_min: number | null;
  rate_max: number | null;
  soundcloud_url: string | null;
  instagram_url: string | null;
  location: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agency {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export type AgencyArtistStatus = "pending" | "active" | "revoked";

export interface AgencyArtist {
  id: string;
  agency_id: string;
  dj_profile_id: string;
  status: AgencyArtistStatus;
  commission_pct: number;
  private_notes: string | null;
  invited_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface RosterEntry extends AgencyArtist {
  dj_profile: Pick<
    DJProfile,
    "id" | "name" | "slug" | "location" | "rate_min" | "rate_max"
  >;
}

export interface Venue {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface VenueContact {
  id: string;
  venue_id: string;
  user_id: string;
  is_primary: boolean;
  created_at: string;
}

export interface Promoter {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}
