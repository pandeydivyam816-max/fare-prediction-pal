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
          created_at: string
          distance_km: number
          drop_label: string
          drop_lat: number | null
          drop_lng: number | null
          drop_place_id: string | null
          duration_minutes: number
          id: string
          pickup_label: string
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_place_id: string | null
          predicted_fare: number | null
          provider_id: string | null
          quoted_fare: number | null
          ride_date: string
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
          created_at?: string
          distance_km?: number
          drop_label: string
          drop_lat?: number | null
          drop_lng?: number | null
          drop_place_id?: string | null
          duration_minutes?: number
          id?: string
          pickup_label: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_place_id?: string | null
          predicted_fare?: number | null
          provider_id?: string | null
          quoted_fare?: number | null
          ride_date?: string
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
          created_at?: string
          distance_km?: number
          drop_label?: string
          drop_lat?: number | null
          drop_lng?: number | null
          drop_place_id?: string | null
          duration_minutes?: number
          id?: string
          pickup_label?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_place_id?: string | null
          predicted_fare?: number | null
          provider_id?: string | null
          quoted_fare?: number | null
          ride_date?: string
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
