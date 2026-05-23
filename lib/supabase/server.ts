import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

// 서버 컴포넌트·서버 액션·라우트 핸들러에서 쓰는 Supabase 클라이언트.
// 요청 쿠키로 로그인 세션을 읽어 RLS(auth.uid())가 동작하게 한다.
// CLAUDE.md 규칙: DB 접근은 항상 이 서버 클라이언트를 사용한다.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서 호출되면 set 이 막힌다.
            // 세션 갱신은 middleware 가 담당하므로 무시해도 안전하다.
          }
        },
      },
    },
  );
}
