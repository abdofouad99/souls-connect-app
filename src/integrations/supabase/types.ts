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
      deposit_receipt_requests: {
        Row: {
          bank_method: string
          created_at: string
          deposit_amount: number
          id: string
          notes: string | null
          phone_number: string
          receipt_image_url: string | null
          sponsor_name: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bank_method: string
          created_at?: string
          deposit_amount: number
          id?: string
          notes?: string | null
          phone_number: string
          receipt_image_url?: string | null
          sponsor_name: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bank_method?: string
          created_at?: string
          deposit_amount?: number
          id?: string
          notes?: string | null
          phone_number?: string
          receipt_image_url?: string | null
          sponsor_name?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          notification_type: string
          recipient_email: string
          recipient_name: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          recipient_email: string
          recipient_name?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          recipient_email?: string
          recipient_name?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      orphans: {
        Row: {
          age: number
          city: string
          country: string
          created_at: string
          full_name: string
          gender: string
          id: string
          intro_video_url: string | null
          monthly_amount: number
          photo_url: string | null
          status: string
          story: string | null
          updated_at: string
        }
        Insert: {
          age: number
          city: string
          country: string
          created_at?: string
          full_name: string
          gender: string
          id?: string
          intro_video_url?: string | null
          monthly_amount: number
          photo_url?: string | null
          status?: string
          story?: string | null
          updated_at?: string
        }
        Update: {
          age?: number
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          gender?: string
          id?: string
          intro_video_url?: string | null
          monthly_amount?: number
          photo_url?: string | null
          status?: string
          story?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          preferred_contact: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          preferred_contact?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          preferred_contact?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          created_at: string
          id: string
          issue_date: string
          payment_reference: string | null
          receipt_number: string
          sponsorship_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          issue_date?: string
          payment_reference?: string | null
          receipt_number: string
          sponsorship_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          issue_date?: string
          payment_reference?: string | null
          receipt_number?: string
          sponsorship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_sponsorship_id_fkey"
            columns: ["sponsorship_id"]
            isOneToOne: false
            referencedRelation: "sponsorships"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          preferred_contact: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          preferred_contact?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          preferred_contact?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sponsorship_requests: {
        Row: {
          admin_notes: string | null
          admin_status: string
          amount: number
          approved_at: string | null
          approved_by: string | null
          cash_receipt_date: string | null
          cash_receipt_image: string | null
          cash_receipt_number: string | null
          created_at: string
          id: string
          orphan_id: string
          payment_method: string
          sponsor_country: string | null
          sponsor_email: string | null
          sponsor_full_name: string
          sponsor_phone: string
          sponsorship_type: string
          transfer_receipt_image: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          admin_status?: string
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          cash_receipt_date?: string | null
          cash_receipt_image?: string | null
          cash_receipt_number?: string | null
          created_at?: string
          id?: string
          orphan_id: string
          payment_method?: string
          sponsor_country?: string | null
          sponsor_email?: string | null
          sponsor_full_name: string
          sponsor_phone: string
          sponsorship_type: string
          transfer_receipt_image?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          admin_status?: string
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          cash_receipt_date?: string | null
          cash_receipt_image?: string | null
          cash_receipt_number?: string | null
          created_at?: string
          id?: string
          orphan_id?: string
          payment_method?: string
          sponsor_country?: string | null
          sponsor_email?: string | null
          sponsor_full_name?: string
          sponsor_phone?: string
          sponsorship_type?: string
          transfer_receipt_image?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_requests_orphan_id_fkey"
            columns: ["orphan_id"]
            isOneToOne: false
            referencedRelation: "orphans"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cash_receipt_date: string | null
          cash_receipt_image: string | null
          cash_receipt_number: string | null
          created_at: string
          end_date: string | null
          id: string
          monthly_amount: number
          orphan_id: string
          payment_method: string
          receipt_image_url: string | null
          receipt_number: string
          request_id: string | null
          sponsor_country: string | null
          sponsor_email: string | null
          sponsor_full_name: string | null
          sponsor_id: string
          sponsor_phone: string | null
          start_date: string
          status: string
          transfer_receipt_image: string | null
          type: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cash_receipt_date?: string | null
          cash_receipt_image?: string | null
          cash_receipt_number?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_amount: number
          orphan_id: string
          payment_method: string
          receipt_image_url?: string | null
          receipt_number: string
          request_id?: string | null
          sponsor_country?: string | null
          sponsor_email?: string | null
          sponsor_full_name?: string | null
          sponsor_id: string
          sponsor_phone?: string | null
          start_date?: string
          status?: string
          transfer_receipt_image?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cash_receipt_date?: string | null
          cash_receipt_image?: string | null
          cash_receipt_number?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_amount?: number
          orphan_id?: string
          payment_method?: string
          receipt_image_url?: string | null
          receipt_number?: string
          request_id?: string | null
          sponsor_country?: string | null
          sponsor_email?: string | null
          sponsor_full_name?: string | null
          sponsor_id?: string
          sponsor_phone?: string | null
          start_date?: string
          status?: string
          transfer_receipt_image?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_orphan_id_fkey"
            columns: ["orphan_id"]
            isOneToOne: false
            referencedRelation: "orphans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "sponsorship_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      generate_receipt_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "sponsor"
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
      app_role: ["admin", "staff", "sponsor"],
    },
  },
} as const
