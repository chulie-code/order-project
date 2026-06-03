"use server";

import { createClient } from "@/lib/supabase/server";

// 랜딩 페이지 리드 폼 제출 저장.
// anon 키로 동작하며, RLS 의 insert 정책(schema.sql)으로만 통과한다.
export async function submitLead(input: {
  name: string;
  email: string;
  insta: string;
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const insta = input.insta?.trim() ?? "";

  if (!name || !email) {
    return { ok: false, error: "성함과 이메일을 입력해주세요." };
  }
  // 느슨한 이메일 형식 검증: a@b.c 형태
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "이메일 형식을 다시 확인해주세요." };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from("leads").insert({
      name,
      email,
      insta: insta || null,
    });

    if (error) {
      console.error("[leads] insert 실패:", error.message);
      return { ok: false, error: "신청에 실패했어요. 잠시 후 다시 시도해주세요." };
    }

    return { ok: true };
  } catch (err) {
    // 환경변수 누락·네트워크 오류 등으로 예외가 나도 throw 하지 않고 결과를 돌려준다.
    console.error("[leads] 예외 발생:", err);
    return { ok: false, error: "신청에 실패했어요. 잠시 후 다시 시도해주세요." };
  }
}
