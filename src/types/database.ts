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
      admin_emails: {
        Row: {
          created_at: string | null
          email: string
        }
        Insert: {
          created_at?: string | null
          email: string
        }
        Update: {
          created_at?: string | null
          email?: string
        }
        Relationships: []
      }
      contractors: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          grace_period_expires_at: string | null
          id: string
          last_login_at: string | null
          login_attempt_count: number
          login_attempt_reset_at: string | null
          phone: string | null
          role: string | null
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          grace_period_expires_at?: string | null
          id: string
          last_login_at?: string | null
          login_attempt_count?: number
          login_attempt_reset_at?: string | null
          phone?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          grace_period_expires_at?: string | null
          id?: string
          last_login_at?: string | null
          login_attempt_count?: number
          login_attempt_reset_at?: string | null
          phone?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      job_categories: {
        Row: {
          contractor_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_categories_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string
          category: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          contractor_id: string
          created_at: string
          id: string
          job_name: string
          original_value: number
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          category?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          contractor_id: string
          created_at?: string
          id?: string
          job_name: string
          original_value?: number
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          category?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          contractor_id?: string
          created_at?: string
          id?: string
          job_name?: string
          original_value?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          admin_notes: string | null
          client_ip: string | null
          client_name: string
          id: string
          signature_data: string
          signed_at: string
          variation_id: string
        }
        Insert: {
          admin_notes?: string | null
          client_ip?: string | null
          client_name: string
          id?: string
          signature_data: string
          signed_at?: string
          variation_id: string
        }
        Update: {
          admin_notes?: string | null
          client_ip?: string | null
          client_name?: string
          id?: string
          signature_data?: string
          signed_at?: string
          variation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: true
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      variations: {
        Row: {
          cost: number
          created_at: string
          date: string
          description: string
          expiry_notice_sent_at: string | null
          expiry_reminder_sent_at: string | null
          id: string
          job_id: string
          photo_url: string | null
          signature_token: string
          signature_token_expires_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          date?: string
          description: string
          expiry_notice_sent_at?: string | null
          expiry_reminder_sent_at?: string | null
          id?: string
          job_id: string
          photo_url?: string | null
          signature_token?: string
          signature_token_expires_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          description?: string
          expiry_notice_sent_at?: string | null
          expiry_reminder_sent_at?: string | null
          id?: string
          job_id?: string
          photo_url?: string | null
          signature_token?: string
          signature_token_expires_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // No-arg form — reads auth.email() from calling JWT internally.
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      verify_signature_token: { Args: { token: string }; Returns: boolean }
      verify_and_mark_csrf_token: {
        Args: { p_token: string; p_user_id: string | null }
        Returns: { is_valid: boolean }
      }
      sign_variation: {
        Args: {
          p_variation_id: string
          p_client_name: string
          p_signature_data: string
          p_client_ip: string | null
        }
        Returns: { success?: boolean; error?: string; code?: string }
      }
      get_variation_by_token: {
        Args: { p_token: string }
        Returns: {
          id: string
          description: string
          cost: number
          date: string
          photo_url: string | null
          status: string
          signature_token_expires_at: string | null
          job_name: string
          client_name: string
          address: string
          signer_name: string | null
          signed_at: string | null
        }[]
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
  public: {
    Enums: {},
  },
} as const
