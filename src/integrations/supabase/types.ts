export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      booking_receipts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          itinerary_id: string | null
          payment_method_last4: string | null
          payment_method_type: string | null
          provider_name: string | null
          receipt_data: Json
          receipt_number: string
          receipt_status: string
          ride_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          itinerary_id?: string | null
          payment_method_last4?: string | null
          payment_method_type?: string | null
          provider_name?: string | null
          receipt_data?: Json
          receipt_number: string
          receipt_status?: string
          ride_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          itinerary_id?: string | null
          payment_method_last4?: string | null
          payment_method_type?: string | null
          provider_name?: string | null
          receipt_data?: Json
          receipt_number?: string
          receipt_status?: string
          ride_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_receipts_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_receipts_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      fare_quotes: {
        Row: {
          created_at: string
          distance_km: number
          drop_label: string
          drop_place_id: string | null
          duration_minutes: number
          estimated_fare: number
          eta_minutes: number | null
          id: string
          pickup_label: string
          pickup_place_id: string | null
          provider_id: string
          quote_expires_at: string | null
          ride_type: string
          surge_multiplier: number
          time_of_day_bucket: string
          traffic_level: string
          user_id: string
          weather_condition: string
        }
        Insert: {
          created_at?: string
          distance_km?: number
          drop_label: string
          drop_place_id?: string | null
          duration_minutes?: number
          estimated_fare: number
          eta_minutes?: number | null
          id?: string
          pickup_label: string
          pickup_place_id?: string | null
          provider_id: string
          quote_expires_at?: string | null
          ride_type: string
          surge_multiplier?: number
          time_of_day_bucket?: string
          traffic_level?: string
          user_id: string
          weather_condition?: string
        }
        Update: {
          created_at?: string
          distance_km?: number
          drop_label?: string
          drop_place_id?: string | null
          duration_minutes?: number
          estimated_fare?: number
          eta_minutes?: number | null
          id?: string
          pickup_label?: string
          pickup_place_id?: string | null
          provider_id?: string
          quote_expires_at?: string | null
          ride_type?: string
          surge_multiplier?: number
          time_of_day_bucket?: string
          traffic_level?: string
          user_id?: string
          weather_condition?: string
        }
        Relationships: [
          {
            foreignKeyName: "fare_quotes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_routes: {
        Row: {
          created_at: string
          drop_label: string
          drop_lat: number | null
          drop_lng: number | null
          drop_place_id: string | null
          id: string
          label: string
          pickup_label: string
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_place_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drop_label: string
          drop_lat?: number | null
          drop_lng?: number | null
          drop_place_id?: string | null
          id?: string
          label: string
          pickup_label: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_place_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          drop_label?: string
          drop_lat?: number | null
          drop_lng?: number | null
          drop_place_id?: string | null
          id?: string
          label?: string
          pickup_label?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_place_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          booked_at: string | null
          canceled_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          label: string
          payment_method_last4: string | null
          payment_method_type: string | null
          predicted_total_fare: number | null
          quoted_total_fare: number | null
          trip_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booked_at?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          label: string
          payment_method_last4?: string | null
          payment_method_type?: string | null
          predicted_total_fare?: number | null
          quoted_total_fare?: number | null
          trip_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booked_at?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          label?: string
          payment_method_last4?: string | null
          payment_method_type?: string | null
          predicted_total_fare?: number | null
          quoted_total_fare?: number | null
          trip_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      itinerary_stops: {
        Row: {
          created_at: string
          id: string
          itinerary_id: string
          label: string
          lat: number | null
          lng: number | null
          place_id: string | null
          stop_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          itinerary_id: string
          label: string
          lat?: number | null
          lng?: number | null
          place_id?: string | null
          stop_order: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          itinerary_id?: string
          label?: string
          lat?: number | null
          lng?: number | null
          place_id?: string | null
          stop_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_stops_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          home_city: string | null
          id: string
          preferred_currency: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          home_city?: string | null
          id?: string
          preferred_currency?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          home_city?: string | null
          id?: string
          preferred_currency?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          base_fare: number
          created_at: string
          eta_bias_minutes: number
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          price_per_km: number
          price_per_minute: number
          slug: string
          surge_multiplier_default: number
          updated_at: string
        }
        Insert: {
          base_fare?: number
          created_at?: string
          eta_bias_minutes?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          price_per_km?: number
          price_per_minute?: number
          slug: string
          surge_multiplier_default?: number
          updated_at?: string
        }
        Update: {
          base_fare?: number
          created_at?: string
          eta_bias_minutes?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          price_per_km?: number
          price_per_minute?: number
          slug?: string
          surge_multiplier_default?: number
          updated_at?: string
        }
        Relationships: []
      }
      rides: {
        Row: {
          actual_fare: number | null
          booked_at: string | null
          booking_reference: string | null
          canceled_at: string | null
          completed_at: string | null
          created_at: string
          distance_km: number
          driver_name: string | null
          driver_phone: string | null
          driver_rating: number | null
          driver_vehicle: string | null
          drop_label: string
          drop_lat: number | null
          drop_lng: number | null
          drop_place_id: string | null
          duration_minutes: number
          eta_minutes: number | null
          id: string
          itinerary_id: string | null
          itinerary_leg_index: number | null
          itinerary_stop_count: number
          payment_method_last4: string | null
          payment_method_type: string | null
          payment_status: string
          pickup_label: string
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_place_id: string | null
          predicted_fare: number | null
          provider_id: string | null
          quoted_fare: number | null
          ride_date: string
          status_updated_at: string
          surge_multiplier: number
          time_of_day_bucket: string
          traffic_level: string
          trip_status: string
          updated_at: string
          user_id: string
          weather_condition: string
        }
        Insert: {
          actual_fare?: number | null
          booked_at?: string | null
          booking_reference?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string
          distance_km?: number
          driver_name?: string | null
          driver_phone?: string | null
          driver_rating?: number | null
          driver_vehicle?: string | null
          drop_label: string
          drop_lat?: number | null
          drop_lng?: number | null
          drop_place_id?: string | null
          duration_minutes?: number
          eta_minutes?: number | null
          id?: string
          itinerary_id?: string | null
          itinerary_leg_index?: number | null
          itinerary_stop_count?: number
          payment_method_last4?: string | null
          payment_method_type?: string | null
          payment_status?: string
          pickup_label: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_place_id?: string | null
          predicted_fare?: number | null
          provider_id?: string | null
          quoted_fare?: number | null
          ride_date?: string
          status_updated_at?: string
          surge_multiplier?: number
          time_of_day_bucket?: string
          traffic_level?: string
          trip_status?: string
          updated_at?: string
          user_id: string
          weather_condition?: string
        }
        Update: {
          actual_fare?: number | null
          booked_at?: string | null
          booking_reference?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string
          distance_km?: number
          driver_name?: string | null
          driver_phone?: string | null
          driver_rating?: number | null
          driver_vehicle?: string | null
          drop_label?: string
          drop_lat?: number | null
          drop_lng?: number | null
          drop_place_id?: string | null
          duration_minutes?: number
          eta_minutes?: number | null
          id?: string
          itinerary_id?: string | null
          itinerary_leg_index?: number | null
          itinerary_stop_count?: number
          payment_method_last4?: string | null
          payment_method_type?: string | null
          payment_status?: string
          pickup_label?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_place_id?: string | null
          predicted_fare?: number | null
          provider_id?: string | null
          quoted_fare?: number | null
          ride_date?: string
          status_updated_at?: string
          surge_multiplier?: number
          time_of_day_bucket?: string
          traffic_level?: string
          trip_status?: string
          updated_at?: string
          user_id?: string
          weather_condition?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "analyst", "user"],
    },
  },
} as const
