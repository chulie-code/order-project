// schema.sql 기준 수기 작성 DB 타입.
// Supabase 프로젝트를 연결한 뒤에는
//   npx supabase gen types typescript --project-id <ref> > types/database.ts
// 로 자동 생성/갱신하는 것을 권장한다.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// 도메인 상태 값 (schema.sql 의 CHECK 제약과 일치)
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "cancelled" | "refunded";
export type OrderStatus = "received" | "preparing" | "ready" | "completed" | "cancelled";
export type AvailabilityStatus = "closed" | "limited";

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string;
          auth_user_id: string;
          shop_name: string;
          slug: string;
          phone: string | null;
          address: string | null;
          intro: string | null;
          profile_image_url: string | null;
          business_hours: Json;
          pickup_slot_minutes: number;
          slot_capacity: number;
          subscription_status: SubscriptionStatus;
          plan: string;
          trial_ends_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          shop_name: string;
          slug: string;
          phone?: string | null;
          address?: string | null;
          intro?: string | null;
          profile_image_url?: string | null;
          business_hours?: Json;
          pickup_slot_minutes?: number;
          slot_capacity?: number;
          subscription_status?: SubscriptionStatus;
          plan?: string;
          trial_ends_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          shop_name?: string;
          slug?: string;
          phone?: string | null;
          address?: string | null;
          intro?: string | null;
          profile_image_url?: string | null;
          business_hours?: Json;
          pickup_slot_minutes?: number;
          slot_capacity?: number;
          subscription_status?: SubscriptionStatus;
          plan?: string;
          trial_ends_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          description: string | null;
          price: number;
          images: string[];
          lead_time_days: number;
          daily_limit: number | null;
          max_quantity_per_order: number;
          options: Json;
          allow_lettering: boolean;
          lettering_max_chars: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          description?: string | null;
          price: number;
          images?: string[];
          lead_time_days?: number;
          daily_limit?: number | null;
          max_quantity_per_order?: number;
          options?: Json;
          allow_lettering?: boolean;
          lettering_max_chars?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          images?: string[];
          lead_time_days?: number;
          daily_limit?: number | null;
          max_quantity_per_order?: number;
          options?: Json;
          allow_lettering?: boolean;
          lettering_max_chars?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey";
            columns: ["shop_id"];
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          shop_id: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          recipient_name: string | null;
          recipient_phone: string | null;
          pickup_date: string;
          pickup_time: string;
          items: Json;
          lettering_text: string | null;
          request_note: string | null;
          reference_image_url: string | null;
          total_amount: number;
          payment_status: PaymentStatus;
          payment_key: string | null;
          paid_at: string | null;
          order_status: OrderStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          pickup_date: string;
          pickup_time: string;
          items: Json;
          lettering_text?: string | null;
          request_note?: string | null;
          reference_image_url?: string | null;
          total_amount: number;
          payment_status?: PaymentStatus;
          payment_key?: string | null;
          paid_at?: string | null;
          order_status?: OrderStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          order_number?: string;
          customer_name?: string;
          customer_phone?: string;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          pickup_date?: string;
          pickup_time?: string;
          items?: Json;
          lettering_text?: string | null;
          request_note?: string | null;
          reference_image_url?: string | null;
          total_amount?: number;
          payment_status?: PaymentStatus;
          payment_key?: string | null;
          paid_at?: string | null;
          order_status?: OrderStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_shop_id_fkey";
            columns: ["shop_id"];
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_overrides: {
        Row: {
          id: string;
          shop_id: string;
          date: string;
          status: AvailabilityStatus;
          note: string | null;
        };
        Insert: {
          id?: string;
          shop_id: string;
          date: string;
          status: AvailabilityStatus;
          note?: string | null;
        };
        Update: {
          id?: string;
          shop_id?: string;
          date?: string;
          status?: AvailabilityStatus;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "availability_overrides_shop_id_fkey";
            columns: ["shop_id"];
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist: {
        Row: {
          id: string;
          name: string;
          phone: string;
          insta: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          insta?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          insta?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

// 편의 타입 별칭
export type Shop = Database["public"]["Tables"]["shops"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type AvailabilityOverride = Database["public"]["Tables"]["availability_overrides"]["Row"];
export type Waitlist = Database["public"]["Tables"]["waitlist"]["Row"];
