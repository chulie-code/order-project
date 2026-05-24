import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { shopSetupSchema } from "@/lib/validations/shop";

// slug 실시간 중복 체크. slug 는 공개 주문페이지 주소라 존재 여부 노출 무방.
// RLS 가 남의 가게 조회를 막으므로 admin 클라이언트로 전역 확인한다.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("slug") ?? "";

  // 형식 검증(소문자/숫자/하이픈, 예약어 등)은 폼 스키마의 slug 규칙 재사용
  const parsed = shopSetupSchema.shape.slug.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shops")
    .select("id")
    .eq("slug", parsed.data)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ available: false, reason: "error" }, { status: 500 });
  }

  return NextResponse.json({ available: !data });
}
