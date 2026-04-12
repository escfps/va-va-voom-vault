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
      reviews: {
        Row: {
          id: string
          profile_id: string
          reviewer_id: string
          rating: number
          text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          reviewer_id: string
          rating: number
          text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          reviewer_id?: string
          rating?: number
          text?: string | null
          created_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number
          amenities: string | null
          attends_to: string | null
          city: string
          cover_image: string | null
          created_at: string
          description: string | null
          detailed_services: Json | null
          ethnicity: string | null
          eye_color: string | null
          gender: string | null
          gender_description: string | null
          genitalia: string | null
          hair_color: string | null
          hair_length: string | null
          has_own_place: boolean | null
          height: string | null
          id: string
          image: string | null
          images: string[] | null
          languages: string[] | null
          location: string | null
          location_distance: string | null
          location_zone: string | null
          max_clients: string | null
          name: string
          nearby_cities: string | null
          neighborhoods: string[] | null
          payment_methods: string[] | null
          phone: string | null
          piercings: boolean | null
          places_served: string | null
          plan: string | null
          plan_expires_at: string | null
          price: number
          price_duration: string | null
          pricing: Json | null
          profile_created_at: string | null
          rating: number | null
          review_count: number | null
          reviews: Json | null
          schedule: Json | null
          services: string[] | null
          sexual_preference: string | null
          sexual_preference_description: string | null
          shoe_size: string | null
          silicone: boolean | null
          smoker: boolean | null
          state: string
          status: string | null
          tagline: string | null
          tags: string[] | null
          tattoos: boolean | null
          updated_at: string
          user_id: string | null
          verified: boolean | null
          verified_date: string | null
          weight: string | null
        }
        Insert: {
          age: number
          amenities?: string | null
          attends_to?: string | null
          city: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          detailed_services?: Json | null
          ethnicity?: string | null
          eye_color?: string | null
          gender?: string | null
          gender_description?: string | null
          genitalia?: string | null
          hair_color?: string | null
          hair_length?: string | null
          has_own_place?: boolean | null
          height?: string | null
          id?: string
          image?: string | null
          images?: string[] | null
          languages?: string[] | null
          location?: string | null
          location_distance?: string | null
          location_zone?: string | null
          max_clients?: string | null
          name: string
          nearby_cities?: string | null
          neighborhoods?: string[] | null
          payment_methods?: string[] | null
          phone?: string | null
          piercings?: boolean | null
          places_served?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          price?: number
          price_duration?: string | null
          pricing?: Json | null
          profile_created_at?: string | null
          rating?: number | null
          review_count?: number | null
          reviews?: Json | null
          schedule?: Json | null
          services?: string[] | null
          sexual_preference?: string | null
          sexual_preference_description?: string | null
          shoe_size?: string | null
          silicone?: boolean | null
          smoker?: boolean | null
          state: string
          status?: string | null
          tagline?: string | null
          tags?: string[] | null
          tattoos?: boolean | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
          verified_date?: string | null
          weight?: string | null
        }
        Update: {
          age?: number
          amenities?: string | null
          attends_to?: string | null
          city?: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          detailed_services?: Json | null
          ethnicity?: string | null
          eye_color?: string | null
          gender?: string | null
          gender_description?: string | null
          genitalia?: string | null
          hair_color?: string | null
          hair_length?: string | null
          has_own_place?: boolean | null
          height?: string | null
          id?: string
          image?: string | null
          images?: string[] | null
          languages?: string[] | null
          location?: string | null
          location_distance?: string | null
          location_zone?: string | null
          max_clients?: string | null
          name?: string
          nearby_cities?: string | null
          neighborhoods?: string[] | null
          payment_methods?: string[] | null
          phone?: string | null
          piercings?: boolean | null
          places_served?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          price?: number
          price_duration?: string | null
          pricing?: Json | null
          profile_created_at?: string | null
          rating?: number | null
          review_count?: number | null
          reviews?: Json | null
          schedule?: Json | null
          services?: string[] | null
          sexual_preference?: string | null
          sexual_preference_description?: string | null
          shoe_size?: string | null
          silicone?: boolean | null
          smoker?: boolean | null
          state?: string
          status?: string | null
          tagline?: string | null
          tags?: string[] | null
          tattoos?: boolean | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
          verified_date?: string | null
          weight?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
