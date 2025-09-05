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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_admins: {
        Row: {
          company: string
          created_at: string
          created_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          created_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          created_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      content_audit_log: {
        Row: {
          action: string
          actor: string | null
          content_id: string | null
          content_table: string
          content_type: string
          created_at: string | null
          from_status: Database["public"]["Enums"]["content_status"] | null
          id: number
          new_record: Json | null
          old_record: Json | null
          to_status: Database["public"]["Enums"]["content_status"] | null
        }
        Insert: {
          action: string
          actor?: string | null
          content_id?: string | null
          content_table: string
          content_type: string
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["content_status"] | null
          id?: number
          new_record?: Json | null
          old_record?: Json | null
          to_status?: Database["public"]["Enums"]["content_status"] | null
        }
        Update: {
          action?: string
          actor?: string | null
          content_id?: string | null
          content_table?: string
          content_type?: string
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["content_status"] | null
          id?: number
          new_record?: Json | null
          old_record?: Json | null
          to_status?: Database["public"]["Enums"]["content_status"] | null
        }
        Relationships: []
      }
      content_feedback: {
        Row: {
          category: string | null
          content_id: string
          content_table: string
          content_type: string
          created_at: string | null
          id: number
          message: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content_id: string
          content_table: string
          content_type: string
          created_at?: string | null
          id?: number
          message?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          content_id?: string
          content_table?: string
          content_type?: string
          created_at?: string | null
          id?: number
          message?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          progress_percentage: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          base_id: string | null
          company_id: string | null
          course_type: string
          created_at: string
          created_by: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          metadata: Json | null
          published_at: string | null
          scope: Database["public"]["Enums"]["content_scope"] | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
          total_modules: number | null
          updated_at: string
          updated_by: string | null
          version: number | null
        }
        Insert: {
          base_id?: string | null
          company_id?: string | null
          course_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          published_at?: string | null
          scope?: Database["public"]["Enums"]["content_scope"] | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
          total_modules?: number | null
          updated_at?: string
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          base_id?: string | null
          company_id?: string | null
          course_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          published_at?: string | null
          scope?: Database["public"]["Enums"]["content_scope"] | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
          total_modules?: number | null
          updated_at?: string
          updated_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      flashcard_reviews: {
        Row: {
          confidence_level: number | null
          created_at: string
          flashcard_id: string
          id: string
          last_reviewed: string
          next_review: string | null
          review_count: number | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string
          flashcard_id: string
          id?: string
          last_reviewed?: string
          next_review?: string | null
          review_count?: number | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string
          flashcard_id?: string
          id?: string
          last_reviewed?: string
          next_review?: string | null
          review_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          base_id: string | null
          company_id: string | null
          course_type: string
          created_at: string
          created_by: string | null
          difficulty: string | null
          front: string
          id: string
          metadata: Json | null
          published_at: string | null
          scope: Database["public"]["Enums"]["content_scope"] | null
          status: Database["public"]["Enums"]["content_status"] | null
          topic: string
          updated_by: string | null
          version: number | null
        }
        Insert: {
          back: string
          base_id?: string | null
          company_id?: string | null
          course_type: string
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          front: string
          id?: string
          metadata?: Json | null
          published_at?: string | null
          scope?: Database["public"]["Enums"]["content_scope"] | null
          status?: Database["public"]["Enums"]["content_status"] | null
          topic: string
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          back?: string
          base_id?: string | null
          company_id?: string | null
          course_type?: string
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          front?: string
          id?: string
          metadata?: Json | null
          published_at?: string | null
          scope?: Database["public"]["Enums"]["content_scope"] | null
          status?: Database["public"]["Enums"]["content_status"] | null
          topic?: string
          updated_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          base_id: string | null
          company_id: string | null
          content: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          metadata: Json | null
          order_index: number
          published_at: string | null
          scope: Database["public"]["Enums"]["content_scope"] | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
          topic: string
          updated_at: string
          updated_by: string | null
          version: number | null
          video_url: string | null
        }
        Insert: {
          base_id?: string | null
          company_id?: string | null
          content?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          metadata?: Json | null
          order_index: number
          published_at?: string | null
          scope?: Database["public"]["Enums"]["content_scope"] | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
          topic: string
          updated_at?: string
          updated_by?: string | null
          version?: number | null
          video_url?: string | null
        }
        Update: {
          base_id?: string | null
          company_id?: string | null
          content?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          metadata?: Json | null
          order_index?: number
          published_at?: string | null
          scope?: Database["public"]["Enums"]["content_scope"] | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
          topic?: string
          updated_at?: string
          updated_by?: string | null
          version?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_test_assignments: {
        Row: {
          assigned_at: string | null
          due_at: string | null
          id: string
          metadata: Json | null
          test_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          test_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          test_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_test_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "practice_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_test_attempts: {
        Row: {
          answers: Json | null
          assignment_id: string | null
          correct_count: number | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          license_type: string
          pass: boolean | null
          question_version: number | null
          raw_questions: Json
          score_percent: number | null
          started_at: string | null
          submitted_at: string | null
          test_id: string
          total_count: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          assignment_id?: string | null
          correct_count?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          license_type: string
          pass?: boolean | null
          question_version?: number | null
          raw_questions: Json
          score_percent?: number | null
          started_at?: string | null
          submitted_at?: string | null
          test_id: string
          total_count?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          assignment_id?: string | null
          correct_count?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          license_type?: string
          pass?: boolean | null
          question_version?: number | null
          raw_questions?: Json
          score_percent?: number | null
          started_at?: string | null
          submitted_at?: string | null
          test_id?: string
          total_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_test_attempts_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "practice_test_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "practice_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_tests: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          license_type: string
          pass_score_percent: number
          question_count: number
          settings: Json | null
          status: string
          time_limit_minutes: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          license_type: string
          pass_score_percent?: number
          question_count?: number
          settings?: Json | null
          status?: string
          time_limit_minutes?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          license_type?: string
          pass_score_percent?: number
          question_count?: number
          settings?: Json | null
          status?: string
          time_limit_minutes?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_audit_log: {
        Row: {
          changed_by: string
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          profile_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          profile_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          profile_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          exam_date: string | null
          exam_type: string | null
          full_name: string | null
          id: string
          last_login: string | null
          manager_ids: string[] | null
          notes: string | null
          state: string | null
          status: string | null
          study_goal_minutes: number | null
          target_exam_date: string | null
          team: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          exam_date?: string | null
          exam_type?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          manager_ids?: string[] | null
          notes?: string | null
          state?: string | null
          status?: string | null
          study_goal_minutes?: number | null
          target_exam_date?: string | null
          team?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          exam_date?: string | null
          exam_type?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          manager_ids?: string[] | null
          notes?: string | null
          state?: string | null
          status?: string | null
          study_goal_minutes?: number | null
          target_exam_date?: string | null
          team?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          base_id: string | null
          company_id: string | null
          correct_answer: number
          course_type: string
          created_at: string
          created_by: string | null
          difficulty: string | null
          explanation: string
          id: string
          metadata: Json | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          published_at: string | null
          question_text: string
          scope: Database["public"]["Enums"]["content_scope"] | null
          status: Database["public"]["Enums"]["content_status"] | null
          topic: string
          updated_by: string | null
          version: number | null
        }
        Insert: {
          base_id?: string | null
          company_id?: string | null
          correct_answer: number
          course_type: string
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          explanation: string
          id?: string
          metadata?: Json | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          published_at?: string | null
          question_text: string
          scope?: Database["public"]["Enums"]["content_scope"] | null
          status?: Database["public"]["Enums"]["content_status"] | null
          topic: string
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          base_id?: string | null
          company_id?: string | null
          correct_answer?: number
          course_type?: string
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          explanation?: string
          id?: string
          metadata?: Json | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          published_at?: string | null
          question_text?: string
          scope?: Database["public"]["Enums"]["content_scope"] | null
          status?: Database["public"]["Enums"]["content_status"] | null
          topic?: string
          updated_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          attempt_type: string | null
          completed_at: string
          correct_answers: number
          id: string
          module_id: string | null
          questions_answered: number
          score_percentage: number
          time_spent_minutes: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          attempt_type?: string | null
          completed_at?: string
          correct_answers?: number
          id?: string
          module_id?: string | null
          questions_answered?: number
          score_percentage: number
          time_spent_minutes?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          attempt_type?: string | null
          completed_at?: string
          correct_answers?: number
          id?: string
          module_id?: string | null
          questions_answered?: number
          score_percentage?: number
          time_spent_minutes?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          items_completed: number | null
          session_date: string
          session_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          items_completed?: number | null
          session_date?: string
          session_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          items_completed?: number | null
          session_date?: string
          session_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          message: string
          read: boolean | null
          subject: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          message: string
          read?: boolean | null
          subject: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string
          read?: boolean | null
          subject?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean | null
          completion_date: string | null
          created_at: string
          id: string
          module_id: string
          time_spent_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completion_date?: string | null
          created_at?: string
          id?: string
          module_id: string
          time_spent_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completion_date?: string | null
          created_at?: string
          id?: string
          module_id?: string
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      practice_test_user_stats: {
        Row: {
          attempts: number | null
          avg_score: number | null
          best_score: number | null
          ever_passed: number | null
          last_attempt_at: string | null
          test_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "practice_tests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_practice_test_questions: {
        Args: { p_license: string; p_limit: number }
        Returns: Json
      }
      get_team_members: {
        Args: { manager_user_id: string }
        Returns: {
          company: string
          email: string
          full_name: string
          last_login: string
          status: string
          team: string
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
      is_admin: {
        Args: Record<PropertyKey, never> | { uid: string }
        Returns: boolean
      }
      is_company_admin: {
        Args:
          | Record<PropertyKey, never>
          | { _company?: string }
          | { uid: string }
        Returns: boolean
      }
      is_instructor: {
        Args: { uid: string }
        Returns: boolean
      }
      user_can_publish: {
        Args: {
          row_company: string
          row_scope: Database["public"]["Enums"]["content_scope"]
          uid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "instructor" | "admin"
      content_scope: "global" | "company" | "course"
      content_status: "draft" | "in_review" | "published" | "archived"
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
      app_role: ["student", "instructor", "admin"],
      content_scope: ["global", "company", "course"],
      content_status: ["draft", "in_review", "published", "archived"],
    },
  },
} as const
