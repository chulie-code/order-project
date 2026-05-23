import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

// 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트.
// 익명(anon) 키만 사용하므로 RLS 정책의 보호를 받는다.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
