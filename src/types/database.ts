export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      agencies: {
        Row: {
          created_at: string | null;
          id: string;
          location: string | null;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          location?: string | null;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          location?: string | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agencies_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      agency_artists: {
        Row: {
          agency_id: string;
          commission_pct: number | null;
          created_at: string | null;
          dj_profile_id: string;
          id: string;
          invited_email: string | null;
          private_notes: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          commission_pct?: number | null;
          created_at?: string | null;
          dj_profile_id: string;
          id?: string;
          invited_email?: string | null;
          private_notes?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          commission_pct?: number | null;
          created_at?: string | null;
          dj_profile_id?: string;
          id?: string;
          invited_email?: string | null;
          private_notes?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agency_artists_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agency_artists_dj_profile_id_fkey";
            columns: ["dj_profile_id"];
            isOneToOne: false;
            referencedRelation: "dj_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_artists: {
        Row: {
          booking_id: string;
          commission_pct: number | null;
          created_at: string | null;
          dj_profile_id: string;
          fee: number;
          id: string;
          payment_split_pct: number | null;
        };
        Insert: {
          booking_id: string;
          commission_pct?: number | null;
          created_at?: string | null;
          dj_profile_id: string;
          fee: number;
          id?: string;
          payment_split_pct?: number | null;
        };
        Update: {
          booking_id?: string;
          commission_pct?: number | null;
          created_at?: string | null;
          dj_profile_id?: string;
          fee?: number;
          id?: string;
          payment_split_pct?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_artists_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_artists_dj_profile_id_fkey";
            columns: ["dj_profile_id"];
            isOneToOne: false;
            referencedRelation: "dj_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_costs: {
        Row: {
          amount: number;
          booking_id: string;
          category: string | null;
          created_at: string | null;
          description: string;
          id: string;
        };
        Insert: {
          amount: number;
          booking_id: string;
          category?: string | null;
          created_at?: string | null;
          description: string;
          id?: string;
        };
        Update: {
          amount?: number;
          booking_id?: string;
          category?: string | null;
          created_at?: string | null;
          description?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_costs_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_dates: {
        Row: {
          booking_id: string;
          created_at: string | null;
          date: string;
          event_name: string | null;
          id: string;
          load_in_time: string | null;
          set_time: string | null;
        };
        Insert: {
          booking_id: string;
          created_at?: string | null;
          date: string;
          event_name?: string | null;
          id?: string;
          load_in_time?: string | null;
          set_time?: string | null;
        };
        Update: {
          booking_id?: string;
          created_at?: string | null;
          date?: string;
          event_name?: string | null;
          id?: string;
          load_in_time?: string | null;
          set_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_dates_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_travel: {
        Row: {
          airline: string | null;
          arrival_airport: string | null;
          arrival_time: string | null;
          booking_id: string;
          check_in: string | null;
          check_out: string | null;
          cost: number | null;
          created_at: string | null;
          departure_airport: string | null;
          departure_time: string | null;
          flight_number: string | null;
          hotel_address: string | null;
          hotel_name: string | null;
          id: string;
          notes: string | null;
          transport_details: string | null;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          airline?: string | null;
          arrival_airport?: string | null;
          arrival_time?: string | null;
          booking_id: string;
          check_in?: string | null;
          check_out?: string | null;
          cost?: number | null;
          created_at?: string | null;
          departure_airport?: string | null;
          departure_time?: string | null;
          flight_number?: string | null;
          hotel_address?: string | null;
          hotel_name?: string | null;
          id?: string;
          notes?: string | null;
          transport_details?: string | null;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          airline?: string | null;
          arrival_airport?: string | null;
          arrival_time?: string | null;
          booking_id?: string;
          check_in?: string | null;
          check_out?: string | null;
          cost?: number | null;
          created_at?: string | null;
          departure_airport?: string | null;
          departure_time?: string | null;
          flight_number?: string | null;
          hotel_address?: string | null;
          hotel_name?: string | null;
          id?: string;
          notes?: string | null;
          transport_details?: string | null;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_travel_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          balance_due_timing: string | null;
          created_at: string | null;
          created_by: string;
          deposit_pct: number | null;
          id: string;
          notes: string | null;
          payer_type: string | null;
          payer_user_id: string | null;
          promoter_id: string | null;
          status: string;
          updated_at: string | null;
          venue_id: string | null;
        };
        Insert: {
          balance_due_timing?: string | null;
          created_at?: string | null;
          created_by: string;
          deposit_pct?: number | null;
          id?: string;
          notes?: string | null;
          payer_type?: string | null;
          payer_user_id?: string | null;
          promoter_id?: string | null;
          status?: string;
          updated_at?: string | null;
          venue_id?: string | null;
        };
        Update: {
          balance_due_timing?: string | null;
          created_at?: string | null;
          created_by?: string;
          deposit_pct?: number | null;
          id?: string;
          notes?: string | null;
          payer_type?: string | null;
          payer_user_id?: string | null;
          promoter_id?: string | null;
          status?: string;
          updated_at?: string | null;
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_payer_user_id_fkey";
            columns: ["payer_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: false;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_cache: {
        Row: {
          cached_at: string | null;
          date: string;
          id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          cached_at?: string | null;
          date: string;
          id?: string;
          status: string;
          user_id: string;
        };
        Update: {
          cached_at?: string | null;
          date?: string;
          id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_cache_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_connections: {
        Row: {
          access_token: string;
          calendar_id: string;
          created_at: string | null;
          id: string;
          provider: string;
          refresh_token: string;
          token_expires_at: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token: string;
          calendar_id?: string;
          created_at?: string | null;
          id?: string;
          provider?: string;
          refresh_token: string;
          token_expires_at: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string;
          calendar_id?: string;
          created_at?: string | null;
          id?: string;
          provider?: string;
          refresh_token?: string;
          token_expires_at?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_connections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contract_clauses: {
        Row: {
          clause_type: string;
          content: string;
          contract_id: string;
          created_at: string | null;
          id: string;
          is_enabled: boolean | null;
          sort_order: number;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          clause_type: string;
          content: string;
          contract_id: string;
          created_at?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          sort_order: number;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          clause_type?: string;
          content?: string;
          contract_id?: string;
          created_at?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          sort_order?: number;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contract_clauses_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
        ];
      };
      contract_signatures: {
        Row: {
          contract_id: string;
          created_at: string | null;
          id: string;
          ip_address: string | null;
          signature_data: string;
          signature_type: string;
          signed_at: string | null;
          signer_email: string;
          signer_name: string;
          signer_role: string;
          signer_user_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          contract_id: string;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          signature_data: string;
          signature_type?: string;
          signed_at?: string | null;
          signer_email: string;
          signer_name: string;
          signer_role: string;
          signer_user_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          contract_id?: string;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          signature_data?: string;
          signature_type?: string;
          signed_at?: string | null;
          signer_email?: string;
          signer_name?: string;
          signer_role?: string;
          signer_user_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contract_signatures_signer_user_id_fkey";
            columns: ["signer_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contracts: {
        Row: {
          booking_id: string;
          created_at: string | null;
          id: string;
          signature_config: string | null;
          signing_token: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          booking_id: string;
          created_at?: string | null;
          id?: string;
          signature_config?: string | null;
          signing_token?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          booking_id?: string;
          created_at?: string | null;
          id?: string;
          signature_config?: string | null;
          signing_token?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: true;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      dj_profiles: {
        Row: {
          bio: string | null;
          created_at: string | null;
          id: string;
          instagram_url: string | null;
          location: string | null;
          name: string;
          rate_max: number | null;
          rate_min: number | null;
          slug: string;
          soundcloud_url: string | null;
          stripe_account_id: string | null;
          stripe_account_status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          instagram_url?: string | null;
          location?: string | null;
          name: string;
          rate_max?: number | null;
          rate_min?: number | null;
          slug: string;
          soundcloud_url?: string | null;
          stripe_account_id?: string | null;
          stripe_account_status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          instagram_url?: string | null;
          location?: string | null;
          name?: string;
          rate_max?: number | null;
          rate_min?: number | null;
          slug?: string;
          soundcloud_url?: string | null;
          stripe_account_id?: string | null;
          stripe_account_status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dj_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_line_items: {
        Row: {
          amount: number;
          category: string | null;
          created_at: string | null;
          description: string;
          id: string;
          invoice_id: string;
        };
        Insert: {
          amount: number;
          category?: string | null;
          created_at?: string | null;
          description: string;
          id?: string;
          invoice_id: string;
        };
        Update: {
          amount?: number;
          category?: string | null;
          created_at?: string | null;
          description?: string;
          id?: string;
          invoice_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          booking_id: string;
          created_at: string | null;
          currency: string | null;
          due_date: string | null;
          id: string;
          invoice_number: string;
          paid_at: string | null;
          sent_at: string | null;
          status: string;
          total_amount: number;
          updated_at: string | null;
        };
        Insert: {
          booking_id: string;
          created_at?: string | null;
          currency?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number: string;
          paid_at?: string | null;
          sent_at?: string | null;
          status?: string;
          total_amount: number;
          updated_at?: string | null;
        };
        Update: {
          booking_id?: string;
          created_at?: string | null;
          currency?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number?: string;
          paid_at?: string | null;
          sent_at?: string | null;
          status?: string;
          total_amount?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      manual_availability: {
        Row: {
          created_at: string | null;
          day_of_week: number | null;
          end_time: string | null;
          id: string;
          is_available: boolean;
          specific_date: string | null;
          start_time: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          day_of_week?: number | null;
          end_time?: string | null;
          id?: string;
          is_available?: boolean;
          specific_date?: string | null;
          start_time?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          day_of_week?: number | null;
          end_time?: string | null;
          id?: string;
          is_available?: boolean;
          specific_date?: string | null;
          start_time?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "manual_availability_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          is_system: boolean | null;
          sender_id: string | null;
          thread_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          is_system?: boolean | null;
          sender_id?: string | null;
          thread_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          is_system?: boolean | null;
          sender_id?: string | null;
          thread_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          created_at: string | null;
          email_enabled: boolean | null;
          id: string;
          notification_type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          notification_type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          notification_type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          booking_id: string;
          created_at: string | null;
          id: string;
          processed_at: string | null;
          scheduled_date: string | null;
          status: string;
          stripe_payment_intent_id: string | null;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          booking_id: string;
          created_at?: string | null;
          id?: string;
          processed_at?: string | null;
          scheduled_date?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          booking_id?: string;
          created_at?: string | null;
          id?: string;
          processed_at?: string | null;
          scheduled_date?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          display_name: string | null;
          id: string;
          stripe_customer_id: string | null;
          updated_at: string | null;
          user_type: string;
        };
        Insert: {
          created_at?: string | null;
          display_name?: string | null;
          id: string;
          stripe_customer_id?: string | null;
          updated_at?: string | null;
          user_type: string;
        };
        Update: {
          created_at?: string | null;
          display_name?: string | null;
          id?: string;
          stripe_customer_id?: string | null;
          updated_at?: string | null;
          user_type?: string;
        };
        Relationships: [];
      };
      promoters: {
        Row: {
          created_at: string | null;
          id: string;
          location: string | null;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          location?: string | null;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          location?: string | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promoters_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      technical_riders: {
        Row: {
          booth_monitors: string | null;
          booth_requirements: string | null;
          created_at: string | null;
          dj_profile_id: string;
          equipment: Json;
          hospitality: string | null;
          id: string;
          is_current: boolean;
          power_requirements: string | null;
          version: number;
        };
        Insert: {
          booth_monitors?: string | null;
          booth_requirements?: string | null;
          created_at?: string | null;
          dj_profile_id: string;
          equipment?: Json;
          hospitality?: string | null;
          id?: string;
          is_current?: boolean;
          power_requirements?: string | null;
          version?: number;
        };
        Update: {
          booth_monitors?: string | null;
          booth_requirements?: string | null;
          created_at?: string | null;
          dj_profile_id?: string;
          equipment?: Json;
          hospitality?: string | null;
          id?: string;
          is_current?: boolean;
          power_requirements?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "technical_riders_dj_profile_id_fkey";
            columns: ["dj_profile_id"];
            isOneToOne: false;
            referencedRelation: "dj_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      threads: {
        Row: {
          booking_id: string;
          created_at: string | null;
          id: string;
        };
        Insert: {
          booking_id: string;
          created_at?: string | null;
          id?: string;
        };
        Update: {
          booking_id?: string;
          created_at?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "threads_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: true;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      transfers: {
        Row: {
          amount: number;
          created_at: string | null;
          id: string;
          payment_id: string;
          recipient_stripe_account: string;
          recipient_type: string;
          status: string;
          stripe_transfer_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          id?: string;
          payment_id: string;
          recipient_stripe_account: string;
          recipient_type: string;
          status?: string;
          stripe_transfer_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          id?: string;
          payment_id?: string;
          recipient_stripe_account?: string;
          recipient_type?: string;
          status?: string;
          stripe_transfer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transfers_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      venue_contacts: {
        Row: {
          created_at: string | null;
          id: string;
          is_primary: boolean | null;
          user_id: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_primary?: boolean | null;
          user_id: string;
          venue_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_primary?: boolean | null;
          user_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venue_contacts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venue_contacts_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      venues: {
        Row: {
          address: string | null;
          capacity: number | null;
          created_at: string | null;
          id: string;
          location: string | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          capacity?: number | null;
          created_at?: string | null;
          id?: string;
          location?: string | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          capacity?: number | null;
          created_at?: string | null;
          id?: string;
          location?: string | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      waitlist_signups: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          name: string | null;
          role: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          name?: string | null;
          role: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          name?: string | null;
          role?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
