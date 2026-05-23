import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

// 서비스 롤(service_role) 키로 RLS 를 우회하는 관리자 클라이언트.
// 고객(비회원)의 상품 조회·주문 생성처럼 로그인 세션 없이 서버에서
// 처리해야 하는 작업에만 사용한다. 절대 클라이언트 번들에 노출 금지.
// ("server-only" import 가 클라이언트에서 import 되면 빌드를 실패시킨다.)
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
