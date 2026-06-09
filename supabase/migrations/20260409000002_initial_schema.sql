


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agencies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agency_artists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agency_id" "uuid" NOT NULL,
    "dj_profile_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "commission_pct" numeric(5,2) DEFAULT 15.00,
    "private_notes" "text",
    "invited_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sort_order" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "agency_artists_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."agency_artists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_access_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_access_tokens_role_check" CHECK (("role" = ANY (ARRAY['payer'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."booking_access_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_artists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "dj_profile_id" "uuid" NOT NULL,
    "fee" numeric(10,2) NOT NULL,
    "commission_pct" numeric(5,2) DEFAULT 15.00,
    "payment_split_pct" numeric(5,2) DEFAULT 100.00,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."booking_artists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_costs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_costs_category_check" CHECK (("category" = ANY (ARRAY['travel'::"text", 'accommodation'::"text", 'equipment'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."booking_costs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "set_time" time without time zone,
    "load_in_time" time without time zone,
    "event_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "end_time" time without time zone
);


ALTER TABLE "public"."booking_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_travel" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "airline" "text",
    "flight_number" "text",
    "departure_airport" "text",
    "arrival_airport" "text",
    "departure_time" timestamp with time zone,
    "arrival_time" timestamp with time zone,
    "hotel_name" "text",
    "hotel_address" "text",
    "check_in" "date",
    "check_out" "date",
    "transport_details" "text",
    "notes" "text",
    "cost" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_travel_type_check" CHECK (("type" = ANY (ARRAY['flight'::"text", 'hotel'::"text", 'ground_transport'::"text"])))
);


ALTER TABLE "public"."booking_travel" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "venue_id" "uuid",
    "promoter_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "payer_type" "text",
    "payer_user_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deposit_pct" numeric(5,2) DEFAULT 50.00,
    "balance_due_timing" "text" DEFAULT 'day_of'::"text",
    CONSTRAINT "bookings_balance_due_timing_check" CHECK (("balance_due_timing" = ANY (ARRAY['day_before'::"text", 'week_before'::"text", 'day_of'::"text"]))),
    CONSTRAINT "bookings_payer_type_check" CHECK (("payer_type" = ANY (ARRAY['venue'::"text", 'promoter'::"text"]))),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'contract_sent'::"text", 'signed'::"text", 'deposit_paid'::"text", 'balance_paid'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "status" "text" NOT NULL,
    "cached_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "calendar_cache_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'busy'::"text"])))
);


ALTER TABLE "public"."calendar_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'google'::"text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "token_expires_at" timestamp with time zone NOT NULL,
    "calendar_id" "text" DEFAULT 'primary'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sync_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "last_synced_at" timestamp with time zone,
    "sync_error" "text",
    CONSTRAINT "calendar_connections_provider_check" CHECK (("provider" = 'google'::"text")),
    CONSTRAINT "calendar_connections_sync_status_check" CHECK (("sync_status" = ANY (ARRAY['active'::"text", 'syncing'::"text", 'error'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."calendar_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_event_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_date_id" "uuid" NOT NULL,
    "dj_profile_id" "uuid" NOT NULL,
    "gcal_event_id" "text" NOT NULL,
    "calendar_id" "text" DEFAULT 'primary'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."calendar_event_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dj_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "rate_min" numeric(10,2),
    "rate_max" numeric(10,2),
    "soundcloud_url" "text",
    "instagram_url" "text",
    "location" "text",
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text" NOT NULL,
    "stripe_account_id" "text",
    "stripe_account_status" "text" DEFAULT 'pending'::"text",
    "w9_status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "w9_completed_at" timestamp with time zone,
    "stripe_tin_provided" boolean DEFAULT false NOT NULL,
    "stripe_kyc_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "stripe_requirements" "jsonb",
    "avatar_url" "text",
    "genres" "text"[],
    "field_visibility" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "press_kit" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "dj_profiles_stripe_account_status_check" CHECK (("stripe_account_status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'restricted'::"text"]))),
    CONSTRAINT "dj_profiles_stripe_kyc_status_check" CHECK (("stripe_kyc_status" = ANY (ARRAY['pending'::"text", 'action_required'::"text", 'verified'::"text", 'restricted'::"text"]))),
    CONSTRAINT "dj_profiles_w9_status_check" CHECK (("w9_status" = ANY (ARRAY['not_started'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."dj_profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."compliance_task_status" AS
 SELECT "id" AS "dj_profile_id",
    "user_id",
    "name",
    "stripe_account_id",
    "w9_status",
    "w9_completed_at",
    "stripe_tin_provided",
    "stripe_kyc_status",
    "stripe_requirements",
    (("w9_status" <> 'completed'::"text") OR (NOT "stripe_tin_provided") OR ("stripe_kyc_status" <> 'verified'::"text")) AS "payout_blocked",
    "array_remove"(ARRAY[
        CASE
            WHEN ("w9_status" <> 'completed'::"text") THEN 'w9_required'::"text"
            ELSE NULL::"text"
        END,
        CASE
            WHEN (NOT "stripe_tin_provided") THEN 'tin_required'::"text"
            ELSE NULL::"text"
        END,
        CASE
            WHEN ("stripe_kyc_status" = 'action_required'::"text") THEN 'kyc_action_required'::"text"
            ELSE NULL::"text"
        END,
        CASE
            WHEN ("stripe_kyc_status" = 'restricted'::"text") THEN 'account_restricted'::"text"
            ELSE NULL::"text"
        END], NULL::"text") AS "outstanding_tasks"
   FROM "public"."dj_profiles" "dp";


ALTER VIEW "public"."compliance_task_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_clauses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "clause_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "sort_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contract_clauses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "signer_role" "text" NOT NULL,
    "signer_name" "text" NOT NULL,
    "signer_email" "text" NOT NULL,
    "signer_user_id" "uuid",
    "signature_data" "text" NOT NULL,
    "signature_type" "text" DEFAULT 'typed'::"text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "signed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "token_hash" "text",
    "clause_snapshot" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "contract_signatures_signature_type_check" CHECK (("signature_type" = ANY (ARRAY['drawn'::"text", 'typed'::"text"]))),
    CONSTRAINT "contract_signatures_signer_role_check" CHECK (("signer_role" = ANY (ARRAY['agency'::"text", 'artist'::"text", 'payer'::"text"])))
);


ALTER TABLE "public"."contract_signatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "signature_config" "text" DEFAULT 'agency_only'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "signing_token" "uuid" DEFAULT "gen_random_uuid"(),
    CONSTRAINT "contracts_signature_config_check" CHECK (("signature_config" = ANY (ARRAY['agency_only'::"text", 'agency_and_artist'::"text"]))),
    CONSTRAINT "contracts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'signed'::"text", 'voided'::"text"])))
);


ALTER TABLE "public"."contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "gross_fee" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "release_hours_after_gig" integer DEFAULT 4 NOT NULL,
    "release_disputed" boolean DEFAULT false NOT NULL,
    "release_disputed_at" timestamp with time zone,
    "release_disputed_by" "uuid",
    "released_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoice_line_items_category_check" CHECK (("category" = ANY (ARRAY['fee'::"text", 'travel'::"text", 'accommodation'::"text", 'equipment'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."invoice_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "due_date" "date",
    "sent_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manual_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "day_of_week" integer,
    "specific_date" "date",
    "is_available" boolean DEFAULT true NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "manual_availability_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "manual_availability_day_or_date_check" CHECK (((("day_of_week" IS NOT NULL) AND ("specific_date" IS NULL)) OR (("day_of_week" IS NULL) AND ("specific_date" IS NOT NULL))))
);


ALTER TABLE "public"."manual_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "sender_id" "uuid",
    "content" "text" NOT NULL,
    "is_system" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "email_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "stripe_payment_intent_id" "text",
    "type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "scheduled_date" "date",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'succeeded'::"text", 'failed'::"text", 'refunded'::"text"]))),
    CONSTRAINT "payments_type_check" CHECK (("type" = ANY (ARRAY['deposit'::"text", 'balance'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "user_type" "text" NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "stripe_customer_id" "text",
    CONSTRAINT "profiles_user_type_check" CHECK (("user_type" = ANY (ARRAY['dj'::"text", 'agency'::"text", 'venue_contact'::"text", 'promoter'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promoters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."promoters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."technical_riders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dj_profile_id" "uuid" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "equipment" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "booth_monitors" "text",
    "booth_requirements" "text",
    "power_requirements" "text",
    "hospitality" "text",
    "is_current" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."technical_riders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."threads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transfers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "stripe_transfer_id" "text",
    "recipient_type" "text" NOT NULL,
    "recipient_stripe_account" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transfers_recipient_type_check" CHECK (("recipient_type" = ANY (ARRAY['dj'::"text", 'agency'::"text"]))),
    CONSTRAINT "transfers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."transfers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."venue_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "address" "text",
    "capacity" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."venues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist_signups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text",
    CONSTRAINT "waitlist_signups_role_check" CHECK (("role" = ANY (ARRAY['dj'::"text", 'promoter'::"text", 'agency'::"text", 'venue'::"text"])))
);


ALTER TABLE "public"."waitlist_signups" OWNER TO "postgres";


COMMENT ON COLUMN "public"."waitlist_signups"."name" IS 'Optional display name provided at signup, used to personalize the confirmation email.';



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."agency_artists"
    ADD CONSTRAINT "agency_artists_agency_id_dj_profile_id_key" UNIQUE ("agency_id", "dj_profile_id");



ALTER TABLE ONLY "public"."agency_artists"
    ADD CONSTRAINT "agency_artists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_access_tokens"
    ADD CONSTRAINT "booking_access_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_access_tokens"
    ADD CONSTRAINT "booking_access_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."booking_artists"
    ADD CONSTRAINT "booking_artists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_costs"
    ADD CONSTRAINT "booking_costs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_dates"
    ADD CONSTRAINT "booking_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_travel"
    ADD CONSTRAINT "booking_travel_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_cache"
    ADD CONSTRAINT "calendar_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_connections"
    ADD CONSTRAINT "calendar_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_event_mappings"
    ADD CONSTRAINT "calendar_event_mappings_booking_date_id_dj_profile_id_key" UNIQUE ("booking_date_id", "dj_profile_id");



ALTER TABLE ONLY "public"."calendar_event_mappings"
    ADD CONSTRAINT "calendar_event_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_clauses"
    ADD CONSTRAINT "contract_clauses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_signatures"
    ADD CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dj_profiles"
    ADD CONSTRAINT "dj_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manual_availability"
    ADD CONSTRAINT "manual_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_notification_type_key" UNIQUE ("user_id", "notification_type");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promoters"
    ADD CONSTRAINT "promoters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promoters"
    ADD CONSTRAINT "promoters_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."technical_riders"
    ADD CONSTRAINT "technical_riders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."threads"
    ADD CONSTRAINT "threads_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."threads"
    ADD CONSTRAINT "threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transfers"
    ADD CONSTRAINT "transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_contacts"
    ADD CONSTRAINT "venue_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_contacts"
    ADD CONSTRAINT "venue_contacts_venue_id_user_id_key" UNIQUE ("venue_id", "user_id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist_signups"
    ADD CONSTRAINT "waitlist_signups_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist_signups"
    ADD CONSTRAINT "waitlist_signups_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "calendar_cache_user_date_idx" ON "public"."calendar_cache" USING "btree" ("user_id", "date");



CREATE UNIQUE INDEX "calendar_connections_user_provider_idx" ON "public"."calendar_connections" USING "btree" ("user_id", "provider");



CREATE INDEX "contract_signatures_contract_id_idx" ON "public"."contract_signatures" USING "btree" ("contract_id");



CREATE UNIQUE INDEX "contracts_signing_token_idx" ON "public"."contracts" USING "btree" ("signing_token");



CREATE INDEX "dj_profiles_compliance_idx" ON "public"."dj_profiles" USING "btree" ("w9_status", "stripe_kyc_status");



CREATE UNIQUE INDEX "dj_profiles_slug_idx" ON "public"."dj_profiles" USING "btree" ("slug");



CREATE UNIQUE INDEX "dj_profiles_user_id_idx" ON "public"."dj_profiles" USING "btree" ("user_id");



CREATE INDEX "manual_availability_user_id_idx" ON "public"."manual_availability" USING "btree" ("user_id");



CREATE INDEX "notification_preferences_user_id_idx" ON "public"."notification_preferences" USING "btree" ("user_id");



CREATE UNIQUE INDEX "technical_riders_current_idx" ON "public"."technical_riders" USING "btree" ("dj_profile_id") WHERE ("is_current" = true);



CREATE INDEX "technical_riders_dj_profile_idx" ON "public"."technical_riders" USING "btree" ("dj_profile_id");



CREATE OR REPLACE TRIGGER "calendar_connections_updated_at" BEFORE UPDATE ON "public"."calendar_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "dj_profiles_updated_at" BEFORE UPDATE ON "public"."dj_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "manual_availability_updated_at" BEFORE UPDATE ON "public"."manual_availability" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "notification_preferences_updated_at" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_agencies_updated_at" BEFORE UPDATE ON "public"."agencies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_agency_artists_updated_at" BEFORE UPDATE ON "public"."agency_artists" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_booking_travel_updated_at" BEFORE UPDATE ON "public"."booking_travel" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_calendar_event_mappings_updated_at" BEFORE UPDATE ON "public"."calendar_event_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_contract_clauses_updated_at" BEFORE UPDATE ON "public"."contract_clauses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_contracts_updated_at" BEFORE UPDATE ON "public"."contracts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_deals_updated_at" BEFORE UPDATE ON "public"."deals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_invoices_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_promoters_updated_at" BEFORE UPDATE ON "public"."promoters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_venues_updated_at" BEFORE UPDATE ON "public"."venues" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "waitlist_signups_updated_at" BEFORE UPDATE ON "public"."waitlist_signups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agency_artists"
    ADD CONSTRAINT "agency_artists_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agency_artists"
    ADD CONSTRAINT "agency_artists_dj_profile_id_fkey" FOREIGN KEY ("dj_profile_id") REFERENCES "public"."dj_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_access_tokens"
    ADD CONSTRAINT "booking_access_tokens_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_artists"
    ADD CONSTRAINT "booking_artists_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_artists"
    ADD CONSTRAINT "booking_artists_dj_profile_id_fkey" FOREIGN KEY ("dj_profile_id") REFERENCES "public"."dj_profiles"("id");



ALTER TABLE ONLY "public"."booking_costs"
    ADD CONSTRAINT "booking_costs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_dates"
    ADD CONSTRAINT "booking_dates_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_travel"
    ADD CONSTRAINT "booking_travel_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_promoter_id_fkey" FOREIGN KEY ("promoter_id") REFERENCES "public"."promoters"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."calendar_cache"
    ADD CONSTRAINT "calendar_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_connections"
    ADD CONSTRAINT "calendar_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_event_mappings"
    ADD CONSTRAINT "calendar_event_mappings_booking_date_id_fkey" FOREIGN KEY ("booking_date_id") REFERENCES "public"."booking_dates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_event_mappings"
    ADD CONSTRAINT "calendar_event_mappings_dj_profile_id_fkey" FOREIGN KEY ("dj_profile_id") REFERENCES "public"."dj_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_clauses"
    ADD CONSTRAINT "contract_clauses_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_signatures"
    ADD CONSTRAINT "contract_signatures_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_signatures"
    ADD CONSTRAINT "contract_signatures_signer_user_id_fkey" FOREIGN KEY ("signer_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_release_disputed_by_fkey" FOREIGN KEY ("release_disputed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."dj_profiles"
    ADD CONSTRAINT "dj_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_availability"
    ADD CONSTRAINT "manual_availability_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promoters"
    ADD CONSTRAINT "promoters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."technical_riders"
    ADD CONSTRAINT "technical_riders_dj_profile_id_fkey" FOREIGN KEY ("dj_profile_id") REFERENCES "public"."dj_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."threads"
    ADD CONSTRAINT "threads_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transfers"
    ADD CONSTRAINT "transfers_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id");



ALTER TABLE ONLY "public"."venue_contacts"
    ADD CONSTRAINT "venue_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_contacts"
    ADD CONSTRAINT "venue_contacts_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



CREATE POLICY "Agency can delete own roster" ON "public"."agency_artists" FOR DELETE USING (("agency_id" IN ( SELECT "agencies"."id"
   FROM "public"."agencies"
  WHERE ("agencies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Agency can insert artists" ON "public"."agency_artists" FOR INSERT WITH CHECK (("agency_id" IN ( SELECT "agencies"."id"
   FROM "public"."agencies"
  WHERE ("agencies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Agency can read own roster" ON "public"."agency_artists" FOR SELECT USING (("agency_id" IN ( SELECT "agencies"."id"
   FROM "public"."agencies"
  WHERE ("agencies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Agency can read rostered DJ event mappings" ON "public"."calendar_event_mappings" FOR SELECT USING (("dj_profile_id" IN ( SELECT "aa"."dj_profile_id"
   FROM ("public"."agency_artists" "aa"
     JOIN "public"."agencies" "a" ON (("a"."id" = "aa"."agency_id")))
  WHERE (("a"."user_id" = "auth"."uid"()) AND ("aa"."status" = 'active'::"text")))));



CREATE POLICY "Agency can update own roster" ON "public"."agency_artists" FOR UPDATE USING (("agency_id" IN ( SELECT "agencies"."id"
   FROM "public"."agencies"
  WHERE ("agencies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Authenticated users can create venues" ON "public"."venues" FOR INSERT WITH CHECK (true);



CREATE POLICY "Authenticated users can view DJ profiles" ON "public"."dj_profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view calendar cache" ON "public"."calendar_cache" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view manual availability" ON "public"."manual_availability" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Booking artists can read bookings" ON "public"."bookings" FOR SELECT USING (("id" IN ( SELECT "ba"."booking_id"
   FROM ("public"."booking_artists" "ba"
     JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
  WHERE ("dp"."user_id" = "auth"."uid"()))));



CREATE POLICY "Booking artists follow booking access" ON "public"."booking_artists" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "booking_artists"."booking_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba2"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba2"."dj_profile_id")))
          WHERE (("ba2"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Booking costs follow booking access" ON "public"."booking_costs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "booking_costs"."booking_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Booking creator can manage contracts" ON "public"."contracts" FOR INSERT WITH CHECK (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Booking creator can manage deals" ON "public"."deals" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "deals"."booking_id") AND ("b"."created_by" = "auth"."uid"())))));



CREATE POLICY "Booking creator can update contracts" ON "public"."contracts" FOR UPDATE USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Booking creator can update deals" ON "public"."deals" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "deals"."booking_id") AND ("b"."created_by" = "auth"."uid"())))));



CREATE POLICY "Booking creators can insert invoices" ON "public"."invoices" FOR INSERT WITH CHECK (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Booking creators can insert line items" ON "public"."invoice_line_items" FOR INSERT WITH CHECK (("invoice_id" IN ( SELECT "i"."id"
   FROM ("public"."invoices" "i"
     JOIN "public"."bookings" "b" ON (("b"."id" = "i"."booking_id")))
  WHERE ("b"."created_by" = "auth"."uid"()))));



CREATE POLICY "Booking creators can update invoices" ON "public"."invoices" FOR UPDATE USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Booking creators can update line items" ON "public"."invoice_line_items" FOR UPDATE USING (("invoice_id" IN ( SELECT "i"."id"
   FROM ("public"."invoices" "i"
     JOIN "public"."bookings" "b" ON (("b"."id" = "i"."booking_id")))
  WHERE ("b"."created_by" = "auth"."uid"()))));



CREATE POLICY "Booking dates follow booking access" ON "public"."booking_dates" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "booking_dates"."booking_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Booking participants can create threads" ON "public"."threads" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "threads"."booking_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()))))));



CREATE POLICY "Booking participants can dispute release" ON "public"."deals" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "deals"."booking_id") AND (("b"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Booking travel follows booking access" ON "public"."booking_travel" FOR SELECT USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings")));



CREATE POLICY "Clauses follow contract access" ON "public"."contract_clauses" FOR SELECT USING (("contract_id" IN ( SELECT "contracts"."id"
   FROM "public"."contracts")));



CREATE POLICY "Contract follows booking access" ON "public"."contracts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "contracts"."booking_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Contract participants can read signatures" ON "public"."contract_signatures" FOR SELECT USING (("contract_id" IN ( SELECT "c"."id"
   FROM ("public"."contracts" "c"
     JOIN "public"."bookings" "b" ON (("b"."id" = "c"."booking_id")))
  WHERE (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Creator can delete booking artists" ON "public"."booking_artists" FOR DELETE USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can delete booking costs" ON "public"."booking_costs" FOR DELETE USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can delete booking dates" ON "public"."booking_dates" FOR DELETE USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can delete booking travel" ON "public"."booking_travel" FOR DELETE USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can delete clauses" ON "public"."contract_clauses" FOR DELETE USING (("contract_id" IN ( SELECT "c"."id"
   FROM ("public"."contracts" "c"
     JOIN "public"."bookings" "b" ON (("b"."id" = "c"."booking_id")))
  WHERE ("b"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can insert booking travel" ON "public"."booking_travel" FOR INSERT WITH CHECK (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can insert bookings" ON "public"."bookings" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Creator can manage booking artists" ON "public"."booking_artists" FOR INSERT WITH CHECK (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can manage booking costs" ON "public"."booking_costs" FOR INSERT WITH CHECK (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can manage booking dates" ON "public"."booking_dates" FOR INSERT WITH CHECK (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can manage clauses" ON "public"."contract_clauses" FOR INSERT WITH CHECK (("contract_id" IN ( SELECT "c"."id"
   FROM ("public"."contracts" "c"
     JOIN "public"."bookings" "b" ON (("b"."id" = "c"."booking_id")))
  WHERE ("b"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can read own bookings" ON "public"."bookings" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creator can update booking artists" ON "public"."booking_artists" FOR UPDATE USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can update booking costs" ON "public"."booking_costs" FOR UPDATE USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can update booking dates" ON "public"."booking_dates" FOR UPDATE USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can update booking travel" ON "public"."booking_travel" FOR UPDATE USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can update clauses" ON "public"."contract_clauses" FOR UPDATE USING (("contract_id" IN ( SELECT "c"."id"
   FROM ("public"."contracts" "c"
     JOIN "public"."bookings" "b" ON (("b"."id" = "c"."booking_id")))
  WHERE ("b"."created_by" = "auth"."uid"()))));



CREATE POLICY "Creator can update own bookings" ON "public"."bookings" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Current riders are publicly readable" ON "public"."technical_riders" FOR SELECT USING (("is_current" = true));



CREATE POLICY "DJ can read own agency relationships" ON "public"."agency_artists" FOR SELECT USING (("dj_profile_id" IN ( SELECT "dj_profiles"."id"
   FROM "public"."dj_profiles"
  WHERE ("dj_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "DJ can read own event mappings" ON "public"."calendar_event_mappings" FOR SELECT USING (("dj_profile_id" IN ( SELECT "dj_profiles"."id"
   FROM "public"."dj_profiles"
  WHERE ("dj_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "DJ can update own agency status" ON "public"."agency_artists" FOR UPDATE USING (("dj_profile_id" IN ( SELECT "dj_profiles"."id"
   FROM "public"."dj_profiles"
  WHERE ("dj_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "DJs can insert own riders" ON "public"."technical_riders" FOR INSERT WITH CHECK (("dj_profile_id" IN ( SELECT "dj_profiles"."id"
   FROM "public"."dj_profiles"
  WHERE ("dj_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "DJs can update own riders" ON "public"."technical_riders" FOR UPDATE USING (("dj_profile_id" IN ( SELECT "dj_profiles"."id"
   FROM "public"."dj_profiles"
  WHERE ("dj_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "DJs can view own riders" ON "public"."technical_riders" FOR SELECT USING (("dj_profile_id" IN ( SELECT "dj_profiles"."id"
   FROM "public"."dj_profiles"
  WHERE ("dj_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Deal follows booking access" ON "public"."deals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "deals"."booking_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Invoices follow booking access" ON "public"."invoices" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "invoices"."booking_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Line items follow invoice access" ON "public"."invoice_line_items" FOR SELECT USING (("invoice_id" IN ( SELECT "invoices"."id"
   FROM "public"."invoices")));



CREATE POLICY "Messages follow thread access" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."threads" "t"
     JOIN "public"."bookings" "b" ON (("b"."id" = "t"."booking_id")))
  WHERE (("t"."id" = "messages"."thread_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "No client access to tokens" ON "public"."booking_access_tokens" USING (false);



CREATE POLICY "No client deletes on event mappings" ON "public"."calendar_event_mappings" FOR DELETE USING (false);



CREATE POLICY "No client inserts on event mappings" ON "public"."calendar_event_mappings" FOR INSERT WITH CHECK (false);



CREATE POLICY "No client inserts on payments" ON "public"."payments" FOR INSERT WITH CHECK (false);



CREATE POLICY "No client inserts on signatures" ON "public"."contract_signatures" FOR INSERT WITH CHECK (false);



CREATE POLICY "No client inserts on transfers" ON "public"."transfers" FOR INSERT WITH CHECK (false);



CREATE POLICY "No client updates on event mappings" ON "public"."calendar_event_mappings" FOR UPDATE USING (false);



CREATE POLICY "No client updates on payments" ON "public"."payments" FOR UPDATE USING (false);



CREATE POLICY "No client updates on transfers" ON "public"."transfers" FOR UPDATE USING (false);



CREATE POLICY "Owner can manage own DJ profile" ON "public"."dj_profiles" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Payer can read bookings" ON "public"."bookings" FOR SELECT USING (("payer_user_id" = "auth"."uid"()));



CREATE POLICY "Payments follow booking access" ON "public"."payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "payments"."booking_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Public can join waitlist" ON "public"."waitlist_signups" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can view DJ profiles" ON "public"."dj_profiles" FOR SELECT USING (true);



CREATE POLICY "Thread participants can send messages" ON "public"."messages" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."threads" "t"
     JOIN "public"."bookings" "b" ON (("b"."id" = "t"."booking_id")))
  WHERE (("t"."id" = "messages"."thread_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))) AND (("sender_id" = "auth"."uid"()) OR (("sender_id" IS NULL) AND ("is_system" = true)))));



CREATE POLICY "Threads follow booking access" ON "public"."threads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "threads"."booking_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Transfers follow payment access" ON "public"."transfers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."payments" "p"
     JOIN "public"."bookings" "b" ON (("b"."id" = "p"."booking_id")))
  WHERE (("p"."id" = "transfers"."payment_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Travel follows booking access" ON "public"."booking_travel" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "booking_travel"."booking_id") AND (("b"."created_by" = "auth"."uid"()) OR ("b"."payer_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."booking_artists" "ba"
             JOIN "public"."dj_profiles" "dp" ON (("dp"."id" = "ba"."dj_profile_id")))
          WHERE (("ba"."booking_id" = "b"."id") AND ("dp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can delete own manual availability" ON "public"."manual_availability" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own notification preferences" ON "public"."notification_preferences" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own agency" ON "public"."agencies" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own manual availability" ON "public"."manual_availability" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own notification preferences" ON "public"."notification_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own promoter" ON "public"."promoters" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own calendar cache" ON "public"."calendar_cache" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own calendar connections" ON "public"."calendar_connections" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own agency" ON "public"."agencies" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read own promoter" ON "public"."promoters" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own venue contacts" ON "public"."venue_contacts" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can select own manual availability" ON "public"."manual_availability" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own notification preferences" ON "public"."notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own agency" ON "public"."agencies" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own manual availability" ON "public"."manual_availability" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notification preferences" ON "public"."notification_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own promoter" ON "public"."promoters" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Venue contacts can read own venue" ON "public"."venues" FOR SELECT USING (("id" IN ( SELECT "venue_contacts"."venue_id"
   FROM "public"."venue_contacts"
  WHERE ("venue_contacts"."user_id" = "auth"."uid"()))));



CREATE POLICY "Venue contacts can update own venue" ON "public"."venues" FOR UPDATE USING (("id" IN ( SELECT "venue_contacts"."venue_id"
   FROM "public"."venue_contacts"
  WHERE ("venue_contacts"."user_id" = "auth"."uid"()))));



CREATE POLICY "Venue members can read co-contacts" ON "public"."venue_contacts" FOR SELECT USING (("venue_id" IN ( SELECT "venue_contacts_1"."venue_id"
   FROM "public"."venue_contacts" "venue_contacts_1"
  WHERE ("venue_contacts_1"."user_id" = "auth"."uid"()))));



CREATE POLICY "Venue primary contact can delete contacts" ON "public"."venue_contacts" FOR DELETE USING (("venue_id" IN ( SELECT "venue_contacts_1"."venue_id"
   FROM "public"."venue_contacts" "venue_contacts_1"
  WHERE (("venue_contacts_1"."user_id" = "auth"."uid"()) AND ("venue_contacts_1"."is_primary" = true)))));



CREATE POLICY "Venue primary contact can insert contacts" ON "public"."venue_contacts" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."agencies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agency_artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_access_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_costs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_travel" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_event_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_clauses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_signatures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dj_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_line_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manual_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promoters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."technical_riders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."threads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transfers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venue_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist_signups" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."agencies" TO "anon";
GRANT ALL ON TABLE "public"."agencies" TO "authenticated";
GRANT ALL ON TABLE "public"."agencies" TO "service_role";



GRANT ALL ON TABLE "public"."agency_artists" TO "anon";
GRANT ALL ON TABLE "public"."agency_artists" TO "authenticated";
GRANT ALL ON TABLE "public"."agency_artists" TO "service_role";



GRANT ALL ON TABLE "public"."booking_access_tokens" TO "anon";
GRANT ALL ON TABLE "public"."booking_access_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_access_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."booking_artists" TO "anon";
GRANT ALL ON TABLE "public"."booking_artists" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_artists" TO "service_role";



GRANT ALL ON TABLE "public"."booking_costs" TO "anon";
GRANT ALL ON TABLE "public"."booking_costs" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_costs" TO "service_role";



GRANT ALL ON TABLE "public"."booking_dates" TO "anon";
GRANT ALL ON TABLE "public"."booking_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_dates" TO "service_role";



GRANT ALL ON TABLE "public"."booking_travel" TO "anon";
GRANT ALL ON TABLE "public"."booking_travel" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_travel" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_cache" TO "anon";
GRANT ALL ON TABLE "public"."calendar_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_cache" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_connections" TO "anon";
GRANT ALL ON TABLE "public"."calendar_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_connections" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_event_mappings" TO "anon";
GRANT ALL ON TABLE "public"."calendar_event_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_event_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."dj_profiles" TO "anon";
GRANT ALL ON TABLE "public"."dj_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."dj_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_task_status" TO "anon";
GRANT ALL ON TABLE "public"."compliance_task_status" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_task_status" TO "service_role";



GRANT ALL ON TABLE "public"."contract_clauses" TO "anon";
GRANT ALL ON TABLE "public"."contract_clauses" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_clauses" TO "service_role";



GRANT ALL ON TABLE "public"."contract_signatures" TO "anon";
GRANT ALL ON TABLE "public"."contract_signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_signatures" TO "service_role";



GRANT ALL ON TABLE "public"."contracts" TO "anon";
GRANT ALL ON TABLE "public"."contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."contracts" TO "service_role";



GRANT ALL ON TABLE "public"."deals" TO "anon";
GRANT ALL ON TABLE "public"."deals" TO "authenticated";
GRANT ALL ON TABLE "public"."deals" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_line_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_line_items" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."manual_availability" TO "anon";
GRANT ALL ON TABLE "public"."manual_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."manual_availability" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promoters" TO "anon";
GRANT ALL ON TABLE "public"."promoters" TO "authenticated";
GRANT ALL ON TABLE "public"."promoters" TO "service_role";



GRANT ALL ON TABLE "public"."technical_riders" TO "anon";
GRANT ALL ON TABLE "public"."technical_riders" TO "authenticated";
GRANT ALL ON TABLE "public"."technical_riders" TO "service_role";



GRANT ALL ON TABLE "public"."threads" TO "anon";
GRANT ALL ON TABLE "public"."threads" TO "authenticated";
GRANT ALL ON TABLE "public"."threads" TO "service_role";



GRANT ALL ON TABLE "public"."transfers" TO "anon";
GRANT ALL ON TABLE "public"."transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."transfers" TO "service_role";



GRANT ALL ON TABLE "public"."venue_contacts" TO "anon";
GRANT ALL ON TABLE "public"."venue_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."venues" TO "anon";
GRANT ALL ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist_signups" TO "anon";
GRANT ALL ON TABLE "public"."waitlist_signups" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist_signups" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































--
-- Dumped schema changes for auth and storage
--

CREATE POLICY "Authenticated press-kit read" ON "storage"."objects" FOR SELECT USING ((("bucket_id" = 'press-kits'::"text") AND ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Owner avatar delete" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'avatars'::"text") AND ("auth"."role"() = 'authenticated'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Owner avatar update" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'avatars'::"text") AND ("auth"."role"() = 'authenticated'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Owner avatar upload" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'avatars'::"text") AND ("auth"."role"() = 'authenticated'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Owner press-kit delete" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'press-kits'::"text") AND ("auth"."role"() = 'authenticated'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Owner press-kit update" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'press-kits'::"text") AND ("auth"."role"() = 'authenticated'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Owner press-kit upload" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'press-kits'::"text") AND ("auth"."role"() = 'authenticated'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Public avatar read" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));



