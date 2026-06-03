import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

// 로그인이 필요한 사장님 관리 경로
// (/debug 는 Supabase 연결 진단 등 내부용 페이지 — 비로그인 노출 금지)
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/products",
  "/orders",
  "/settings",
  "/debug",
];
// 이미 로그인했다면 갈 필요 없는 경로
const AUTH_ROUTES = ["/login", "/signup"];

// 매 요청마다 Supabase 세션을 갱신하고, 경로 접근 권한을 검사한다.
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

  // createServerClient 와 getUser 사이에는 다른 코드를 넣지 않는다(세션 갱신 보장).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1) 비로그인 사용자가 보호된 경로 접근 → /login (원래 가려던 곳을 next 로 보존)
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 2) 로그인 사용자가 로그인/가입 페이지 접근 → /dashboard
  if (user && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
