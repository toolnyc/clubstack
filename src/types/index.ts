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

export interface Booking {
  id: string;
  created_by: string;
  venue_id: string | null;
  promoter_id: string | null;
  status: BookingStatus | "cancelled";
  payer_type: "venue" | "promoter" | null;
  payer_user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingDate {
  id: string;
  booking_id: string;
  date: string;
  set_time: string | null;
  load_in_time: string | null;
  event_name: string | null;
  created_at: string;
}

export interface BookingArtist {
  id: string;
  booking_id: string;
  dj_profile_id: string;
  fee: number;
  commission_pct: number;
  payment_split_pct: number;
  created_at: string;
}

export type CostCategory = "travel" | "accommodation" | "equipment" | "other";

export interface BookingCost {
  id: string;
  booking_id: string;
  description: string;
  amount: number;
  category: CostCategory | null;
  created_at: string;
}

export type ContractStatus = "draft" | "sent" | "signed" | "voided";
export type SignatureConfig = "agency_only" | "agency_and_artist";

export interface Contract {
  id: string;
  booking_id: string;
  status: ContractStatus;
  signature_config: SignatureConfig;
  created_at: string;
  updated_at: string;
}

export type ClauseType =
  | "parties"
  | "compensation"
  | "cancellation"
  | "rider"
  | "force_majeure"
  | "pay_or_play"
  | "recording_rights"
  | "independent_contractor"
  | "modifications";

export interface ContractClause {
  id: string;
  contract_id: string;
  clause_type: ClauseType;
  title: string;
  content: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type SignerRole = "agency" | "artist" | "payer";
export type SignatureType = "drawn" | "typed";

export type PaymentType = "deposit" | "balance";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "refunded";
export type BalanceDueTiming = "day_before" | "week_before" | "day_of";

export interface Payment {
  id: string;
  booking_id: string;
  stripe_payment_intent_id: string | null;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  scheduled_date: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TransferRecipientType = "dj" | "agency";
export type TransferStatus = "pending" | "completed" | "failed";

export interface Transfer {
  id: string;
  payment_id: string;
  stripe_transfer_id: string | null;
  recipient_type: TransferRecipientType;
  recipient_stripe_account: string;
  amount: number;
  status: TransferStatus;
  created_at: string;
}

export interface ContractSignature {
  id: string;
  contract_id: string;
  signer_role: SignerRole;
  signer_name: string;
  signer_email: string;
  signer_user_id: string | null;
  signature_data: string;
  signature_type: SignatureType;
  ip_address: string | null;
  user_agent: string | null;
  signed_at: string;
  created_at: string;
}

export interface EquipmentRequirements {
  cdjs?: boolean;
  cdj_model?: string;
  turntables?: boolean;
  turntable_model?: string;
  mixer?: boolean;
  mixer_model?: string;
  needles_provided?: boolean;
  usb_required?: boolean;
  laptop_stand?: boolean;
  other?: string;
}

export interface TechnicalRider {
  id: string;
  dj_profile_id: string;
  version: number;
  equipment: EquipmentRequirements;
  booth_monitors: string | null;
  booth_requirements: string | null;
  power_requirements: string | null;
  hospitality: string | null;
  is_current: boolean;
  created_at: string;
}

export interface Thread {
  id: string;
  booking_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string | null;
  content: string;
  is_system: boolean;
  created_at: string;
}

export interface ManualAvailability {
  id: string;
  user_id: string;
  day_of_week: number | null;
  specific_date: string | null;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export type InvoiceLineItemCategory =
  | "fee"
  | "travel"
  | "accommodation"
  | "equipment"
  | "other";

export interface Invoice {
  id: string;
  booking_id: string;
  invoice_number: string;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  amount: number;
  category: InvoiceLineItemCategory | null;
  created_at: string;
}

export type NotificationType =
  | "contract_sent"
  | "contract_signed"
  | "payment_received"
  | "payment_due"
  | "booking_confirmed"
  | "calendar_conflict"
  | "agency_invite";

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}
