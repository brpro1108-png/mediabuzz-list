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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      collections: {
        Row: {
          backdrop_path: string | null
          created_at: string
          id: string
          name: string
          poster_path: string | null
          tmdb_collection_id: number
          user_id: string
        }
        Insert: {
          backdrop_path?: string | null
          created_at?: string
          id?: string
          name: string
          poster_path?: string | null
          tmdb_collection_id: number
          user_id: string
        }
        Update: {
          backdrop_path?: string | null
          created_at?: string
          id?: string
          name?: string
          poster_path?: string | null
          tmdb_collection_id?: number
          user_id?: string
        }
        Relationships: []
      }
      import_state: {
        Row: {
          collections_count: number
          created_at: string
          current_phase: string | null
          id: string
          is_importing: boolean
          last_sync_at: string | null
          movies_imported: number
          movies_page: number
          movies_skipped: number
          movies_total_pages: number | null
          series_imported: number
          series_page: number
          series_skipped: number
          series_total_pages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          collections_count?: number
          created_at?: string
          current_phase?: string | null
          id?: string
          is_importing?: boolean
          last_sync_at?: string | null
          movies_imported?: number
          movies_page?: number
          movies_skipped?: number
          movies_total_pages?: number | null
          series_imported?: number
          series_page?: number
          series_skipped?: number
          series_total_pages?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          collections_count?: number
          created_at?: string
          current_phase?: string | null
          id?: string
          is_importing?: boolean
          last_sync_at?: string | null
          movies_imported?: number
          movies_page?: number
          movies_skipped?: number
          movies_total_pages?: number | null
          series_imported?: number
          series_page?: number
          series_skipped?: number
          series_total_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      media_items: {
        Row: {
          backdrop_path: string | null
          collection_id: string | null
          created_at: string
          genres: string[] | null
          id: string
          media_type: string
          overview: string | null
          poster_path: string | null
          release_date: string | null
          title: string
          tmdb_id: number
          updated_at: string
          user_id: string
          vote_average: number | null
        }
        Insert: {
          backdrop_path?: string | null
          collection_id?: string | null
          created_at?: string
          genres?: string[] | null
          id?: string
          media_type: string
          overview?: string | null
          poster_path?: string | null
          release_date?: string | null
          title: string
          tmdb_id: number
          updated_at?: string
          user_id: string
          vote_average?: number | null
        }
        Update: {
          backdrop_path?: string | null
          collection_id?: string | null
          created_at?: string
          genres?: string[] | null
          id?: string
          media_type?: string
          overview?: string | null
          poster_path?: string | null
          release_date?: string | null
          title?: string
          tmdb_id?: number
          updated_at?: string
          user_id?: string
          vote_average?: number | null
        }
        Relationships: []
      }
      media_load_state: {
        Row: {
          animes_pages: number
          created_at: string
          docs_pages: number
          id: string
          movies_pages: number
          series_pages: number
          updated_at: string
          user_id: string
        }
        Insert: {
          animes_pages?: number
          created_at?: string
          docs_pages?: number
          id?: string
          movies_pages?: number
          series_pages?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          animes_pages?: number
          created_at?: string
          docs_pages?: number
          id?: string
          movies_pages?: number
          series_pages?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      uploaded_media: {
        Row: {
          created_at: string
          id: string
          media_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: string
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
