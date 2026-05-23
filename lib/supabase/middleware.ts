import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

// 매 요청마다 Supabase 세션(액세스 토큰)을 갱신하고 쿠키를 동기화한다.
// 이걸 두지 않으면 서버 컴포넌트에서 로그인 상태가 만료된 채 남을 수 있다.
export async function updateSession(request: NextRequest) {
  // 환경변수가 아직 설정되지 않았으면 세션 갱신을 건너뛴다.
  // (키 입력 전에도 앱이 500 으로 죽지 않게 함)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() 호출이 만료된 토큰을 갱신한다. (getSession 대신 getUser 사용 권장)
  await supabase.auth.getUser();

  return supabaseResponse;
}
