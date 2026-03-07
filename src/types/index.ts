export const GENRES = [
  "House",
  "Techno",
  "Drum & Bass",
  "Disco",
  "Afrobeats",
  "Amapiano",
  "Garage",
  "Jungle",
  "Breaks",
  "Dubstep",
  "Trance",
  "Minimal",
  "Ambient",
  "Downtempo",
  "Hip-Hop",
  "R&B",
  "Dancehall",
  "Reggaeton",
  "Latin",
  "Open Format",
  "Other",
] as const;

export type Genre = (typeof GENRES)[number];

export interface DJProfile {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  bio: string | null;
  genres: Genre[];
  location: string | null;
  photo_url: string | null;
  soundcloud_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  rate_min: number | null;
  rate_max: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  calendar_id: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusyPeriod {
  start: string;
  end: string;
}

export interface AvailabilityResult {
  busy: BusyPeriod[];
  timeMin: string;
  timeMax: string;
}
