export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agencies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_artists: {
        Row: {
          agency_id: string
          commission_pct: number | null
          created_at: string | null
          dj_profile_id: string
          id: string
          invited_email: string | null
          private_notes: string | null
          sort_order: number
          status: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          commission_pct?: number | null
          created_at?: string | null
          dj_profile_id: string
          id?: string
          invited_email?: string | null
          private_notes?: string | null
          sort_order?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          commission_pct?: number | null
          created_at?: string | null
          dj_profile_id?: string
          id?: string
          invited_email?: string | null
          private_notes?: string | null
          sort_order?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_artists_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_artists_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "compliance_task_status"
            referencedColumns: ["dj_profile_id"]
          },
          {
            foreignKeyName: "agency_artists_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_access_tokens: {
        Row: {
          booking_id: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          role: string
          token: string
          used_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          role: string
          token: string
          used_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          role?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_access_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_artists: {
        Row: {
          booking_id: string
          commission_pct: number | null
          created_at: string | null
          dj_profile_id: string
          fee: number
          id: string
          payment_split_pct: number | null
        }
        Insert: {
          booking_id: string
          commission_pct?: number | null
          created_at?: string | null
          dj_profile_id: string
          fee: number
          id?: string
          payment_split_pct?: number | null
        }
        Update: {
          booking_id?: string
          commission_pct?: number | null
          created_at?: string | null
          dj_profile_id?: string
          fee?: number
          id?: string
          payment_split_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_artists_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_artists_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "compliance_task_status"
            referencedColumns: ["dj_profile_id"]
          },
          {
            foreignKeyName: "booking_artists_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_costs: {
        Row: {
          amount: number
          booking_id: string
          category: string | null
          created_at: string | null
          description: string
          id: string
        }
        Insert: {
          amount: number
          booking_id: string
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_costs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_dates: {
        Row: {
          booking_id: string
          created_at: string | null
          date: string
          end_time: string | null
          event_name: string | null
          id: string
          load_in_time: string | null
          set_time: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          date: string
          end_time?: string | null
          event_name?: string | null
          id?: string
          load_in_time?: string | null
          set_time?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          date?: string
          end_time?: string | null
          event_name?: string | null
          id?: string
          load_in_time?: string | null
          set_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_dates_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_travel: {
        Row: {
          airline: string | null
          arrival_airport: string | null
          arrival_time: string | null
          booking_id: string
          check_in: string | null
          check_out: string | null
          cost: number | null
          created_at: string | null
          departure_airport: string | null
          departure_time: string | null
          flight_number: string | null
          hotel_address: string | null
          hotel_name: string | null
          id: string
          notes: string | null
          transport_details: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          airline?: string | null
          arrival_airport?: string | null
          arrival_time?: string | null
          booking_id: string
          check_in?: string | null
          check_out?: string | null
          cost?: number | null
          created_at?: string | null
          departure_airport?: string | null
          departure_time?: string | null
          flight_number?: string | null
          hotel_address?: string | null
          hotel_name?: string | null
          id?: string
          notes?: string | null
          transport_details?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          airline?: string | null
          arrival_airport?: string | null
          arrival_time?: string | null
          booking_id?: string
          check_in?: string | null
          check_out?: string | null
          cost?: number | null
          created_at?: string | null
          departure_airport?: string | null
          departure_time?: string | null
          flight_number?: string | null
          hotel_address?: string | null
          hotel_name?: string | null
          id?: string
          notes?: string | null
          transport_details?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_travel_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          balance_due_timing: string | null
          created_at: string | null
          created_by: string
          deposit_pct: number | null
          id: string
          notes: string | null
          payer_type: string | null
          payer_user_id: string | null
          promoter_id: string | null
          status: string
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          balance_due_timing?: string | null
          created_at?: string | null
          created_by: string
          deposit_pct?: number | null
          id?: string
          notes?: string | null
          payer_type?: string | null
          payer_user_id?: string | null
          promoter_id?: string | null
          status?: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          balance_due_timing?: string | null
          created_at?: string | null
          created_by?: string
          deposit_pct?: number | null
          id?: string
          notes?: string | null
          payer_type?: string | null
          payer_user_id?: string | null
          promoter_id?: string | null
          status?: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_payer_user_id_fkey"
            columns: ["payer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_cache: {
        Row: {
          cached_at: string | null
          date: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          cached_at?: string | null
          date: string
          id?: string
          status: string
          user_id: string
        }
        Update: {
          cached_at?: string | null
          date?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string
          calendar_id: string
          created_at: string | null
          id: string
          last_synced_at: string | null
          provider: string
          refresh_token: string
          sync_error: string | null
          sync_status: string
          token_expires_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token: string
          sync_error?: string | null
          sync_status?: string
          token_expires_at: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string
          sync_error?: string | null
          sync_status?: string
          token_expires_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_mappings: {
        Row: {
          booking_date_id: string
          calendar_id: string
          created_at: string | null
          dj_profile_id: string
          gcal_event_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          booking_date_id: string
          calendar_id?: string
          created_at?: string | null
          dj_profile_id: string
          gcal_event_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          booking_date_id?: string
          calendar_id?: string
          created_at?: string | null
          dj_profile_id?: string
          gcal_event_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_mappings_booking_date_id_fkey"
            columns: ["booking_date_id"]
            isOneToOne: false
            referencedRelation: "booking_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_mappings_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "compliance_task_status"
            referencedColumns: ["dj_profile_id"]
          },
          {
            foreignKeyName: "calendar_event_mappings_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_clauses: {
        Row: {
          clause_type: string
          content: string
          contract_id: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          clause_type: string
          content: string
          contract_id: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          sort_order: number
          title: string
          updated_at?: string | null
        }
        Update: {
          clause_type?: string
          content?: string
          contract_id?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_clauses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_fee_line_payees: {
        Row: {
          created_at: string
          entitlement_kind: string
          entitlement_value: number
          fee_line_id: string
          id: string
          priority: number
          recipient_user_id: string
          role_label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          entitlement_kind: string
          entitlement_value: number
          fee_line_id: string
          id?: string
          priority?: number
          recipient_user_id: string
          role_label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          entitlement_kind?: string
          entitlement_value?: number
          fee_line_id?: string
          id?: string
          priority?: number
          recipient_user_id?: string
          role_label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_fee_line_payees_fee_line_id_fkey"
            columns: ["fee_line_id"]
            isOneToOne: false
            referencedRelation: "contract_fee_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_fee_line_payees_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_fee_lines: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          description: string
          id: string
          sort_order: number
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          description: string
          id?: string
          sort_order?: number
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_fee_lines_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signatures: {
        Row: {
          clause_snapshot: Json
          contract_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          signature_data: string
          signature_type: string
          signed_at: string | null
          signer_email: string
          signer_name: string
          signer_role: string
          signer_user_id: string | null
          token_hash: string | null
          user_agent: string | null
        }
        Insert: {
          clause_snapshot?: Json
          contract_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          signature_data: string
          signature_type?: string
          signed_at?: string | null
          signer_email: string
          signer_name: string
          signer_role: string
          signer_user_id?: string | null
          token_hash?: string | null
          user_agent?: string | null
        }
        Update: {
          clause_snapshot?: Json
          contract_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          signature_data?: string
          signature_type?: string
          signed_at?: string | null
          signer_email?: string
          signer_name?: string
          signer_role?: string
          signer_user_id?: string | null
          token_hash?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_signatures_signer_user_id_fkey"
            columns: ["signer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          signature_config: string | null
          signing_token: string | null
          status: string
          terms_snapshot: Json | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          signature_config?: string | null
          signing_token?: string | null
          status?: string
          terms_snapshot?: Json | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          signature_config?: string | null
          signing_token?: string | null
          status?: string
          terms_snapshot?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          booking_id: string
          created_at: string | null
          currency: string
          gross_fee: number
          id: string
          release_disputed: boolean
          release_disputed_at: string | null
          release_disputed_by: string | null
          release_hours_after_gig: number
          released_at: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          currency?: string
          gross_fee: number
          id?: string
          release_disputed?: boolean
          release_disputed_at?: string | null
          release_disputed_by?: string | null
          release_hours_after_gig?: number
          released_at?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          currency?: string
          gross_fee?: number
          id?: string
          release_disputed?: boolean
          release_disputed_at?: string | null
          release_disputed_by?: string | null
          release_hours_after_gig?: number
          released_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_release_disputed_by_fkey"
            columns: ["release_disputed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          field_visibility: Json
          genres: string[] | null
          id: string
          instagram_url: string | null
          location: string | null
          name: string
          press_kit: Json
          rate_max: number | null
          rate_min: number | null
          slug: string
          soundcloud_url: string | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_kyc_status: string
          stripe_requirements: Json | null
          stripe_tin_provided: boolean
          updated_at: string | null
          user_id: string
          w9_completed_at: string | null
          w9_status: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          field_visibility?: Json
          genres?: string[] | null
          id?: string
          instagram_url?: string | null
          location?: string | null
          name: string
          press_kit?: Json
          rate_max?: number | null
          rate_min?: number | null
          slug: string
          soundcloud_url?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_kyc_status?: string
          stripe_requirements?: Json | null
          stripe_tin_provided?: boolean
          updated_at?: string | null
          user_id: string
          w9_completed_at?: string | null
          w9_status?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          field_visibility?: Json
          genres?: string[] | null
          id?: string
          instagram_url?: string | null
          location?: string | null
          name?: string
          press_kit?: Json
          rate_max?: number | null
          rate_min?: number | null
          slug?: string
          soundcloud_url?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_kyc_status?: string
          stripe_requirements?: Json | null
          stripe_tin_provided?: boolean
          updated_at?: string | null
          user_id?: string
          w9_completed_at?: string | null
          w9_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string
          id: string
          invoice_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          booking_id: string
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string
          paid_at: string | null
          sent_at: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_availability: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          end_time: string | null
          id: string
          is_available: boolean
          specific_date: string | null
          start_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          is_available?: boolean
          specific_date?: string | null
          start_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          is_available?: boolean
          specific_date?: string | null
          start_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_system: boolean | null
          sender_id: string | null
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          sender_id?: string | null
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          sender_id?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          notification_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notification_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notification_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          id: string
          processed_at: string | null
          scheduled_date: string | null
          status: string
          stripe_payment_intent_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          scheduled_date?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          scheduled_date?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          stripe_customer_id: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_type: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      promoters: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_riders: {
        Row: {
          booth_monitors: string | null
          booth_requirements: string | null
          created_at: string | null
          dj_profile_id: string
          equipment: Json
          hospitality: string | null
          id: string
          is_current: boolean
          power_requirements: string | null
          version: number
        }
        Insert: {
          booth_monitors?: string | null
          booth_requirements?: string | null
          created_at?: string | null
          dj_profile_id: string
          equipment?: Json
          hospitality?: string | null
          id?: string
          is_current?: boolean
          power_requirements?: string | null
          version?: number
        }
        Update: {
          booth_monitors?: string | null
          booth_requirements?: string | null
          created_at?: string | null
          dj_profile_id?: string
          equipment?: Json
          hospitality?: string | null
          id?: string
          is_current?: boolean
          power_requirements?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "technical_riders_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "compliance_task_status"
            referencedColumns: ["dj_profile_id"]
          },
          {
            foreignKeyName: "technical_riders_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_id: string
          recipient_stripe_account: string
          recipient_type: string
          status: string
          stripe_transfer_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_id: string
          recipient_stripe_account: string
          recipient_type: string
          status?: string
          stripe_transfer_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_id?: string
          recipient_stripe_account?: string
          recipient_type?: string
          status?: string
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_contacts: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_contacts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          capacity: number | null
          created_at: string | null
          id: string
          location: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      compliance_task_status: {
        Row: {
          dj_profile_id: string | null
          name: string | null
          outstanding_tasks: string[] | null
          payout_blocked: boolean | null
          stripe_account_id: string | null
          stripe_kyc_status: string | null
          stripe_requirements: Json | null
          stripe_tin_provided: boolean | null
          user_id: string | null
          w9_completed_at: string | null
          w9_status: string | null
        }
        Insert: {
          dj_profile_id?: string | null
          name?: string | null
          outstanding_tasks?: never
          payout_blocked?: never
          stripe_account_id?: string | null
          stripe_kyc_status?: string | null
          stripe_requirements?: Json | null
          stripe_tin_provided?: boolean | null
          user_id?: string | null
          w9_completed_at?: string | null
          w9_status?: string | null
        }
        Update: {
          dj_profile_id?: string | null
          name?: string | null
          outstanding_tasks?: never
          payout_blocked?: never
          stripe_account_id?: string | null
          stripe_kyc_status?: string | null
          stripe_requirements?: Json | null
          stripe_tin_provided?: boolean | null
          user_id?: string | null
          w9_completed_at?: string | null
          w9_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_earnings_history: {
        Args: never
        Returns: {
          commission: number
          commission_pct: number
          date: string
          event_name: string
          fee: number
          id: string
          net: number
          status: string
          venue_name: string
        }[]
      }
      get_earnings_summary: {
        Args: never
        Returns: {
          gig_count: number
          total_earned: number
          total_pending: number
          total_upcoming: number
        }[]
      }
      has_booking_access: { Args: { p_booking_id: string }; Returns: boolean }
      has_contract_access: { Args: { p_contract_id: string }; Returns: boolean }
      is_booking_artist: { Args: { p_booking_id: string }; Returns: boolean }
      is_contract_owner: { Args: { p_contract_id: string }; Returns: boolean }
      is_venue_member: { Args: { p_venue_id: string }; Returns: boolean }
      is_venue_primary_contact: {
        Args: { p_venue_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

