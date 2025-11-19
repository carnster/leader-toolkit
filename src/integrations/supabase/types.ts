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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      active_ingredients: {
        Row: {
          adaptable_boundaries: string[] | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          initiative_id: string
          is_core: boolean
          look_fors: string[] | null
          name: string
        }
        Insert: {
          adaptable_boundaries?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initiative_id: string
          is_core?: boolean
          look_fors?: string[] | null
          name: string
        }
        Update: {
          adaptable_boundaries?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initiative_id?: string
          is_core?: boolean
          look_fors?: string[] | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_ingredients_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          actual_cost: number | null
          category: string
          created_at: string
          description: string | null
          estimated_cost: number
          funding_source: string | null
          id: string
          initiative_id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          category: string
          created_at?: string
          description?: string | null
          estimated_cost?: number
          funding_source?: string | null
          id?: string
          initiative_id: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          category?: string
          created_at?: string
          description?: string | null
          estimated_cost?: number
          funding_source?: string | null
          id?: string
          initiative_id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_activities: {
        Row: {
          activity_type: string
          channel: string | null
          completed: boolean
          completed_date: string | null
          created_at: string
          description: string
          id: string
          initiative_id: string
          notes: string | null
          scheduled_date: string | null
          stakeholder_group: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          channel?: string | null
          completed?: boolean
          completed_date?: string | null
          created_at?: string
          description: string
          id?: string
          initiative_id: string
          notes?: string | null
          scheduled_date?: string | null
          stakeholder_group: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          channel?: string | null
          completed?: boolean
          completed_date?: string | null
          created_at?: string
          description?: string
          id?: string
          initiative_id?: string
          notes?: string | null
          scheduled_date?: string | null
          stakeholder_group?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_activities_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_briefs: {
        Row: {
          baseline_data: string | null
          checklist_completed: boolean | null
          chosen_approach: string | null
          created_at: string
          equity_notes: string | null
          evidence_base: string | null
          feasibility_factors: Json | null
          feasibility_score: number | null
          goals: string | null
          goals_feedback: Json | null
          id: string
          initiative_id: string
          lagging_indicators: string[] | null
          leading_indicators: string[] | null
          measurement_timeline: string | null
          problem_statement: string
          root_causes: string[] | null
          stakeholder_input: string | null
          target_group: string
          updated_at: string
        }
        Insert: {
          baseline_data?: string | null
          checklist_completed?: boolean | null
          chosen_approach?: string | null
          created_at?: string
          equity_notes?: string | null
          evidence_base?: string | null
          feasibility_factors?: Json | null
          feasibility_score?: number | null
          goals?: string | null
          goals_feedback?: Json | null
          id?: string
          initiative_id: string
          lagging_indicators?: string[] | null
          leading_indicators?: string[] | null
          measurement_timeline?: string | null
          problem_statement: string
          root_causes?: string[] | null
          stakeholder_input?: string | null
          target_group: string
          updated_at?: string
        }
        Update: {
          baseline_data?: string | null
          checklist_completed?: boolean | null
          chosen_approach?: string | null
          created_at?: string
          equity_notes?: string | null
          evidence_base?: string | null
          feasibility_factors?: Json | null
          feasibility_score?: number | null
          goals?: string | null
          goals_feedback?: Json | null
          id?: string
          initiative_id?: string
          lagging_indicators?: string[] | null
          leading_indicators?: string[] | null
          measurement_timeline?: string | null
          problem_statement?: string
          root_causes?: string[] | null
          stakeholder_input?: string | null
          target_group?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_briefs_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: true
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      fidelity_checklists: {
        Row: {
          active_ingredient_id: string | null
          checklist_items: Json
          created_at: string
          description: string | null
          id: string
          initiative_id: string
          name: string
          rating_scale: Json
          updated_at: string
        }
        Insert: {
          active_ingredient_id?: string | null
          checklist_items?: Json
          created_at?: string
          description?: string | null
          id?: string
          initiative_id: string
          name: string
          rating_scale?: Json
          updated_at?: string
        }
        Update: {
          active_ingredient_id?: string | null
          checklist_items?: Json
          created_at?: string
          description?: string | null
          id?: string
          initiative_id?: string
          name?: string
          rating_scale?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fidelity_checklists_active_ingredient_id_fkey"
            columns: ["active_ingredient_id"]
            isOneToOne: false
            referencedRelation: "active_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fidelity_checklists_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      fidelity_logs: {
        Row: {
          checklist_id: string | null
          checklist_responses: Json | null
          component_id: string | null
          created_at: string
          duration_minutes: number | null
          evidence_photos: string[] | null
          id: string
          initiative_id: string
          location: string | null
          notes: string | null
          observed_at: string
          observer_id: string
          rating: number
          schedule_id: string | null
        }
        Insert: {
          checklist_id?: string | null
          checklist_responses?: Json | null
          component_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          evidence_photos?: string[] | null
          id?: string
          initiative_id: string
          location?: string | null
          notes?: string | null
          observed_at?: string
          observer_id: string
          rating: number
          schedule_id?: string | null
        }
        Update: {
          checklist_id?: string | null
          checklist_responses?: Json | null
          component_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          evidence_photos?: string[] | null
          id?: string
          initiative_id?: string
          location?: string | null
          notes?: string | null
          observed_at?: string
          observer_id?: string
          rating?: number
          schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fidelity_logs_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "fidelity_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fidelity_logs_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "active_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fidelity_logs_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fidelity_logs_observer_id_fkey"
            columns: ["observer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fidelity_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "observation_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_risks: {
        Row: {
          contingency_plan: string | null
          created_at: string
          id: string
          impact: string
          initiative_id: string
          likelihood: string
          mitigation_strategy: string
          owner_id: string | null
          risk_category: string
          risk_description: string
          status: string
          updated_at: string
        }
        Insert: {
          contingency_plan?: string | null
          created_at?: string
          id?: string
          impact: string
          initiative_id: string
          likelihood: string
          mitigation_strategy: string
          owner_id?: string | null
          risk_category: string
          risk_description: string
          status?: string
          updated_at?: string
        }
        Update: {
          contingency_plan?: string | null
          created_at?: string
          id?: string
          impact?: string
          initiative_id?: string
          likelihood?: string
          mitigation_strategy?: string
          owner_id?: string | null
          risk_category?: string
          risk_description?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementation_risks_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_strategies: {
        Row: {
          created_at: string
          description: string | null
          eric_category: string
          id: string
          initiative_id: string
          resources_needed: string | null
          responsible_party: string | null
          status: string
          strategy_name: string
          success_indicators: string | null
          target_barrier: string | null
          timeline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          eric_category: string
          id?: string
          initiative_id: string
          resources_needed?: string | null
          responsible_party?: string | null
          status?: string
          strategy_name: string
          success_indicators?: string | null
          target_barrier?: string | null
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          eric_category?: string
          id?: string
          initiative_id?: string
          resources_needed?: string | null
          responsible_party?: string | null
          status?: string
          strategy_name?: string
          success_indicators?: string | null
          target_barrier?: string | null
          timeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      indicator_values: {
        Row: {
          id: string
          indicator_id: string
          notes: string | null
          recorded_at: string
          value: number
        }
        Insert: {
          id?: string
          indicator_id: string
          notes?: string | null
          recorded_at?: string
          value: number
        }
        Update: {
          id?: string
          indicator_id?: string
          notes?: string | null
          recorded_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "indicator_values_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      indicators: {
        Row: {
          created_at: string
          id: string
          initiative_id: string
          name: string
          schedule: string | null
          source: string | null
          target_value: number | null
          type: Database["public"]["Enums"]["indicator_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          initiative_id: string
          name: string
          schedule?: string | null
          source?: string | null
          target_value?: number | null
          type: Database["public"]["Enums"]["indicator_type"]
        }
        Update: {
          created_at?: string
          id?: string
          initiative_id?: string
          name?: string
          schedule?: string | null
          source?: string | null
          target_value?: number | null
          type?: Database["public"]["Enums"]["indicator_type"]
        }
        Relationships: [
          {
            foreignKeyName: "indicators_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_team_members: {
        Row: {
          id: string
          initiative_id: string
          joined_at: string
          name: string | null
          responsibilities: string[] | null
          role_in_initiative: string
          user_id: string | null
        }
        Insert: {
          id?: string
          initiative_id: string
          joined_at?: string
          name?: string | null
          responsibilities?: string[] | null
          role_in_initiative: string
          user_id?: string | null
        }
        Update: {
          id?: string
          initiative_id?: string
          joined_at?: string
          name?: string | null
          responsibilities?: string[] | null
          role_in_initiative?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "initiative_team_members_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_templates: {
        Row: {
          active_ingredients: Json
          category: string
          created_at: string
          decision_brief_template: Json | null
          description: string | null
          evidence_base: string | null
          id: string
          name: string
          resources_needed: string[] | null
          target_outcomes: string[]
          typical_timeline: string | null
          updated_at: string
        }
        Insert: {
          active_ingredients?: Json
          category: string
          created_at?: string
          decision_brief_template?: Json | null
          description?: string | null
          evidence_base?: string | null
          id?: string
          name: string
          resources_needed?: string[] | null
          target_outcomes?: string[]
          typical_timeline?: string | null
          updated_at?: string
        }
        Update: {
          active_ingredients?: Json
          category?: string
          created_at?: string
          decision_brief_template?: Json | null
          description?: string | null
          evidence_base?: string | null
          id?: string
          name?: string
          resources_needed?: string[] | null
          target_outcomes?: string[]
          typical_timeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      initiatives: {
        Row: {
          context_tags: string[] | null
          created_at: string
          description: string | null
          id: string
          owner_id: string
          stage: Database["public"]["Enums"]["initiative_stage"]
          start_date: string | null
          status: Database["public"]["Enums"]["initiative_status"]
          target_end_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          context_tags?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          owner_id: string
          stage?: Database["public"]["Enums"]["initiative_stage"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["initiative_status"]
          target_end_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          context_tags?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string
          stage?: Database["public"]["Enums"]["initiative_stage"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["initiative_status"]
          target_end_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          initiative_id: string | null
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          initiative_id?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          initiative_id?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      observation_schedules: {
        Row: {
          active_ingredient_id: string | null
          completed_observation_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          implementer_id: string | null
          initiative_id: string
          location: string | null
          notes: string | null
          observation_type: string
          observer_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          active_ingredient_id?: string | null
          completed_observation_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          implementer_id?: string | null
          initiative_id: string
          location?: string | null
          notes?: string | null
          observation_type: string
          observer_id?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          active_ingredient_id?: string | null
          completed_observation_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          implementer_id?: string | null
          initiative_id?: string
          location?: string | null
          notes?: string | null
          observation_type?: string
          observer_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "observation_schedules_active_ingredient_id_fkey"
            columns: ["active_ingredient_id"]
            isOneToOne: false
            referencedRelation: "active_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observation_schedules_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      pd_activities: {
        Row: {
          activity_type: string
          attendance_count: number | null
          completion_status: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          facilitator: string | null
          fidelity_focus: string[] | null
          id: string
          initiative_id: string
          scheduled_date: string | null
          target_audience: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          attendance_count?: number | null
          completion_status?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          facilitator?: string | null
          fidelity_focus?: string[] | null
          id?: string
          initiative_id: string
          scheduled_date?: string | null
          target_audience?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          attendance_count?: number | null
          completion_status?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          facilitator?: string | null
          fidelity_focus?: string[] | null
          id?: string
          initiative_id?: string
          scheduled_date?: string | null
          target_audience?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pd_activities_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      pdsa_cycles: {
        Row: {
          aim: string
          change_idea: string
          created_at: string
          cycle_number: number
          decision: string | null
          id: string
          initiative_id: string
          results: string | null
          status: Database["public"]["Enums"]["pdsa_status"]
          test_window_end: string | null
          test_window_start: string | null
          updated_at: string
        }
        Insert: {
          aim: string
          change_idea: string
          created_at?: string
          cycle_number: number
          decision?: string | null
          id?: string
          initiative_id: string
          results?: string | null
          status?: Database["public"]["Enums"]["pdsa_status"]
          test_window_end?: string | null
          test_window_start?: string | null
          updated_at?: string
        }
        Update: {
          aim?: string
          change_idea?: string
          created_at?: string
          cycle_number?: number
          decision?: string | null
          id?: string
          initiative_id?: string
          results?: string | null
          status?: Database["public"]["Enums"]["pdsa_status"]
          test_window_end?: string | null
          test_window_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdsa_cycles_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          organization: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          organization?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          organization?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sustainability_plans: {
        Row: {
          created_at: string
          embedding_routines: Json | null
          id: string
          initiative_id: string
          next_steps: string | null
          onboarding_resources: Json | null
          resource_protections: Json | null
          scale_readiness_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          embedding_routines?: Json | null
          id?: string
          initiative_id: string
          next_steps?: string | null
          onboarding_resources?: Json | null
          resource_protections?: Json | null
          scale_readiness_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          embedding_routines?: Json | null
          id?: string
          initiative_id?: string
          next_steps?: string | null
          onboarding_resources?: Json | null
          resource_protections?: Json | null
          scale_readiness_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sustainability_plans_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: true
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      time_commitments: {
        Row: {
          created_at: string
          description: string | null
          hours_per_month: number | null
          hours_per_week: number | null
          id: string
          initiative_id: string
          notes: string | null
          role_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hours_per_month?: number | null
          hours_per_week?: number | null
          id?: string
          initiative_id: string
          notes?: string | null
          role_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hours_per_month?: number | null
          hours_per_week?: number | null
          id?: string
          initiative_id?: string
          notes?: string | null
          role_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_commitments_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_milestones: {
        Row: {
          completion_date: string | null
          created_at: string
          id: string
          initiative_id: string
          milestone: string
          notes: string | null
          phase: string
          status: string
          sub_stage: string | null
          target_date: string
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          created_at?: string
          id?: string
          initiative_id: string
          milestone: string
          notes?: string | null
          phase: string
          status?: string
          sub_stage?: string | null
          target_date: string
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          created_at?: string
          id?: string
          initiative_id?: string
          milestone?: string
          notes?: string | null
          phase?: string
          status?: string
          sub_stage?: string | null
          target_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_milestones_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
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
      create_milestone_notifications: { Args: never; Returns: undefined }
      create_observation_notifications: { Args: never; Returns: undefined }
      create_pd_notifications: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_initiative_team_member: {
        Args: { _initiative_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "district_leader"
        | "principal"
        | "implementation_lead"
        | "teacher"
        | "data_manager"
        | "governor"
      indicator_type: "leading" | "lagging"
      initiative_stage: "decide" | "plan" | "implement" | "monitor" | "sustain"
      initiative_status: "active" | "on_hold" | "completed" | "archived"
      pdsa_status: "planning" | "testing" | "complete"
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
      app_role: [
        "district_leader",
        "principal",
        "implementation_lead",
        "teacher",
        "data_manager",
        "governor",
      ],
      indicator_type: ["leading", "lagging"],
      initiative_stage: ["decide", "plan", "implement", "monitor", "sustain"],
      initiative_status: ["active", "on_hold", "completed", "archived"],
      pdsa_status: ["planning", "testing", "complete"],
    },
  },
} as const
