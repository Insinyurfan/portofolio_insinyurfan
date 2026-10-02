/**
 * BERKAS INI DIHASILKAN OTOMATIS — JANGAN DISUNTING TANGAN.
 *
 * Dihasilkan dari skema database Supabase dengan:
 *   npm run db:types
 *
 * Jalankan ulang perintah itu setiap kali ada migrasi baru, lalu commit
 * hasilnya. Kalau berkas ini melenceng dari skema, `tsc` yang akan
 * menunjukkannya — itulah gunanya tipe ini dihasilkan, bukan ditulis tangan.
 */

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: Database["public"]["Enums"]["achievement_category"]
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean
          issued_date: string | null
          issuer: string | null
          sort_order: number
          title: string
          updated_at: string
          verification_url: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["achievement_category"]
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          issued_date?: string | null
          issuer?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          verification_url?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["achievement_category"]
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          issued_date?: string | null
          issuer?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          verification_url?: string | null
        }
        Relationships: []
      }
      education: {
        Row: {
          created_at: string
          degree: string | null
          description: string | null
          end_year: number | null
          gpa: number | null
          id: string
          institution: string
          is_published: boolean
          major: string | null
          sort_order: number
          start_year: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_year?: number | null
          gpa?: number | null
          id?: string
          institution: string
          is_published?: boolean
          major?: string | null
          sort_order?: number
          start_year: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_year?: number | null
          gpa?: number | null
          id?: string
          institution?: string
          is_published?: boolean
          major?: string | null
          sort_order?: number
          start_year?: number
          updated_at?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_ongoing: boolean
          is_published: boolean
          organization: string
          position: string
          sort_order: number
          start_date: string
          type: Database["public"]["Enums"]["experience_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_ongoing?: boolean
          is_published?: boolean
          organization: string
          position: string
          sort_order?: number
          start_date: string
          type: Database["public"]["Enums"]["experience_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_ongoing?: boolean
          is_published?: boolean
          organization?: string
          position?: string
          sort_order?: number
          start_date?: string
          type?: Database["public"]["Enums"]["experience_type"]
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_published: boolean
          is_read: boolean
          sender_email: string
          sender_name: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_published?: boolean
          is_read?: boolean
          sender_email: string
          sender_name: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_published?: boolean
          is_read?: boolean
          sender_email?: string
          sender_name?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          bio: string | null
          created_at: string
          cv_url: string | null
          email: string | null
          full_name: string
          id: string
          is_open_to_work: boolean
          is_published: boolean
          location: string | null
          photo_url: string | null
          roles: string[]
          singleton: boolean
          tagline: string | null
          updated_at: string
          username: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          cv_url?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_open_to_work?: boolean
          is_published?: boolean
          location?: string | null
          photo_url?: string | null
          roles?: string[]
          singleton?: boolean
          tagline?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          cv_url?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_open_to_work?: boolean
          is_published?: boolean
          location?: string | null
          photo_url?: string | null
          roles?: string[]
          singleton?: boolean
          tagline?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          demo_url: string | null
          description: string | null
          featured: boolean
          gallery: string[]
          id: string
          is_published: boolean
          repo_url: string | null
          slug: string
          sort_order: number
          summary: string | null
          tech_stack: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          demo_url?: string | null
          description?: string | null
          featured?: boolean
          gallery?: string[]
          id?: string
          is_published?: boolean
          repo_url?: string | null
          slug: string
          sort_order?: number
          summary?: string | null
          tech_stack?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          demo_url?: string | null
          description?: string | null
          featured?: boolean
          gallery?: string[]
          id?: string
          is_published?: boolean
          repo_url?: string | null
          slug?: string
          sort_order?: number
          summary?: string | null
          tech_stack?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          is_published: boolean
          reviewer_name: string
          stars: number
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_published?: boolean
          reviewer_name: string
          stars: number
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_published?: boolean
          reviewer_name?: string
          stars?: number
          updated_at?: string
        }
        Relationships: []
      }
      skill_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_published: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category_id: string
          created_at: string
          icon: string | null
          id: string
          is_published: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          platform: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      swap_sort_order: {
        Args: { p_direction: number; p_id: string; p_table: string }
        Returns: boolean
      }
    }
    Enums: {
      achievement_category: "certificate" | "award"
      experience_type: "work" | "internship" | "organization" | "freelance"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      achievement_category: ["certificate", "award"],
      experience_type: ["work", "internship", "organization", "freelance"],
    },
  },
} as const
