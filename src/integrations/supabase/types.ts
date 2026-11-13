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
    PostgrestVersion: "12.2.3"
  }
  public: {
    Tables: {
      bar_duties: {
        Row: {
          created_at: string
          duty_date: string
          id: string
          knvb_only: boolean
          player_one_id: number
          player_two_id: number
          season_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duty_date: string
          id?: string
          knvb_only?: boolean
          player_one_id: number
          player_two_id: number
          season_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duty_date?: string
          id?: string
          knvb_only?: boolean
          player_one_id?: number
          player_two_id?: number
          season_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_duties_player_one_id_fkey"
            columns: ["player_one_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_duties_player_two_id_fkey"
            columns: ["player_two_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_duties_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      drills: {
        Row: {
          active: boolean
          category: string
          coaching_points: string[]
          created_at: string
          duration: number
          explanation: string
          fixed: boolean
          id: string
          material: string | null
          max_players: number
          min_players: number
          name: string
          sketch: string | null
          tactical: boolean
          variants: Json
        }
        Insert: {
          active?: boolean
          category: string
          coaching_points?: string[]
          created_at?: string
          duration: number
          explanation: string
          fixed?: boolean
          id: string
          material?: string | null
          max_players: number
          min_players: number
          name: string
          sketch?: string | null
          tactical?: boolean
          variants?: Json
        }
        Update: {
          active?: boolean
          category?: string
          coaching_points?: string[]
          created_at?: string
          duration?: number
          explanation?: string
          fixed?: boolean
          id?: string
          material?: string | null
          max_players?: number
          min_players?: number
          name?: string
          sketch?: string | null
          tactical?: boolean
          variants?: Json
        }
        Relationships: []
      }
      event_statuses: {
        Row: {
          event_id: number
          player_id: number
          status: Database["public"]["Enums"]["event_attendance_status"]
        }
        Insert: {
          event_id: number
          player_id: number
          status?: Database["public"]["Enums"]["event_attendance_status"]
        }
        Update: {
          event_id?: number
          player_id?: number
          status?: Database["public"]["Enums"]["event_attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "event_statuses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_statuses_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          event_time: string | null
          id: number
          location: string | null
          season_id: number | null
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: number
          location?: string | null
          season_id?: number | null
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: number
          location?: string | null
          season_id?: number | null
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          arrival_time: string | null
          id: number
          match_date: string | null
          opponent: string
          season_id: number | null
          start_time: string | null
        }
        Insert: {
          arrival_time?: string | null
          id?: number
          match_date?: string | null
          opponent: string
          season_id?: number | null
          start_time?: string | null
        }
        Update: {
          arrival_time?: string | null
          id?: number
          match_date?: string | null
          opponent?: string
          season_id?: number | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      player_levels: {
        Row: {
          player_id: number
          tier: string
          updated_at: string
        }
        Insert: {
          player_id: number
          tier?: string
          updated_at?: string
        }
        Update: {
          player_id?: number
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_levels_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_statuses: {
        Row: {
          match_id: number
          player_id: number
          status: Database["public"]["Enums"]["player_status"]
        }
        Insert: {
          match_id: number
          player_id: number
          status: Database["public"]["Enums"]["player_status"]
        }
        Update: {
          match_id?: number
          player_id?: number
          status?: Database["public"]["Enums"]["player_status"]
        }
        Relationships: [
          {
            foreignKeyName: "player_statuses_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_statuses_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_training_info: {
        Row: {
          player_id: number
          positions: string[]
          team: number
          updated_at: string
        }
        Insert: {
          player_id: number
          positions?: string[]
          team: number
          updated_at?: string
        }
        Update: {
          player_id?: number
          positions?: string[]
          team?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_training_info_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          id: number
          knvb_member: boolean
          name: string
          user_id: string | null
        }
        Insert: {
          id?: number
          knvb_member?: boolean
          name: string
          user_id?: string | null
        }
        Update: {
          id?: number
          knvb_member?: boolean
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string
          id: number
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: never
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: never
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_location: {
        Row: {
          id: number
          latitude: number
          longitude: number
          name: string | null
          radius_meters: number
          updated_at: string
        }
        Insert: {
          id?: number
          latitude: number
          longitude: number
          name?: string | null
          radius_meters?: number
          updated_at?: string
        }
        Update: {
          id?: number
          latitude?: number
          longitude?: number
          name?: string | null
          radius_meters?: number
          updated_at?: string
        }
        Relationships: []
      }
      training_plan_blocks: {
        Row: {
          drill_id: string
          id: string
          minutes: number
          plan_id: string
          position: number
        }
        Insert: {
          drill_id: string
          id?: string
          minutes: number
          plan_id: string
          position: number
        }
        Update: {
          drill_id?: string
          id?: string
          minutes?: number
          plan_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_plan_blocks_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plan_blocks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          player_count: number | null
          status: string
          teams_shared: boolean
          theme: string | null
          training_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          player_count?: number | null
          status?: string
          teams_shared?: boolean
          theme?: string | null
          training_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          player_count?: number | null
          status?: string
          teams_shared?: boolean
          theme?: string | null
          training_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: true
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_statuses: {
        Row: {
          player_id: number
          status: Database["public"]["Enums"]["training_status"]
          training_id: number
          verified_at: string | null
          verified_latitude: number | null
          verified_longitude: number | null
        }
        Insert: {
          player_id: number
          status: Database["public"]["Enums"]["training_status"]
          training_id: number
          verified_at?: string | null
          verified_latitude?: number | null
          verified_longitude?: number | null
        }
        Update: {
          player_id?: number
          status?: Database["public"]["Enums"]["training_status"]
          training_id?: number
          verified_at?: string | null
          verified_latitude?: number | null
          verified_longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_statuses_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_statuses_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_team_assignments: {
        Row: {
          field: number
          plan_id: string
          player_id: number
          side: string
        }
        Insert: {
          field: number
          plan_id: string
          player_id: number
          side: string
        }
        Update: {
          field?: number
          plan_id?: string
          player_id?: number
          side?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_team_assignments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_team_assignments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          id: number
          season_id: number | null
          training_at: string
        }
        Insert: {
          id?: number
          season_id?: number | null
          training_at: string
        }
        Update: {
          id?: number
          season_id?: number | null
          training_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      admin_list_players: {
        Args: never
        Returns: {
          id: number
          knvb_member: boolean
          name: string
          user_id: string
        }[]
      }
      admin_list_trainer_player_ids: {
        Args: never
        Returns: {
          player_id: number
          role: string
        }[]
      }
      admin_set_trainer: {
        Args: { _enabled: boolean; _player_id: number }
        Returns: undefined
      }
      get_my_player: {
        Args: never
        Returns: {
          id: number
          knvb_member: boolean
          name: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_my_player: { Args: { _player_id: number }; Returns: boolean }
      is_trainer: { Args: { _user_id: string }; Returns: boolean }
      set_my_positions: { Args: { _positions: string[] }; Returns: undefined }
    }
    Enums: {
      app_role: "user" | "superuser" | "trainer"
      event_attendance_status: "YES" | "NO" | "MAYBE" | "UNKNOWN"
      player_status: "IN" | "OUT" | "MAYBE" | "UNKNOWN"
      training_status: "YES" | "NO" | "UNKNOWN"
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
      app_role: ["user", "superuser", "trainer"],
      event_attendance_status: ["YES", "NO", "MAYBE", "UNKNOWN"],
      player_status: ["IN", "OUT", "MAYBE", "UNKNOWN"],
      training_status: ["YES", "NO", "UNKNOWN"],
    },
  },
} as const
