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

export interface DJProfile {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  bio: string | null;
  location: string | null;
  soundcloud_url: string | null;
  instagram_url: string | null;
  rate_min: number | null;
  rate_max: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
