import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// 카카오 인증 후 Supabase 가 code 와 함께 이 경로로 돌려보낸다.
// code 를 세션으로 교환(쿠키 저장)한 뒤 목적지로 리다이렉트한다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // next 는 우리 앱 내부 경로만 허용 (오픈 리다이렉트 방지)
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") ? nextParam : "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // code 가 없거나 교환 실패 → 로그인 페이지로 에러 표시와 함께
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
