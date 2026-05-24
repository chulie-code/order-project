"use server";

import { createClient } from "@/lib/supabase/server";

// 랜딩 페이지 사전 신청(waitlist) 저장.
// anon 키로 동작하며, RLS 의 insert 정책(schema.sql)으로만 통과한다.
export async function submitWaitlist(input: {
  name: string;
  phone: string;
  insta: string;
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.name?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const insta = input.insta?.trim() ?? "";

  if (!name || !phone) {
    return { ok: false, error: "성함과 연락처를 입력해주세요." };
  }
  // 느슨한 연락처 검증: 숫자만 추렸을 때 9자리 이상
  if (phone.replace(/[^0-9]/g, "").length < 9) {
    return { ok: false, error: "연락처를 다시 확인해주세요." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("waitlist").insert({
    name,
    phone,
    insta: insta || null,
  });

  if (error) {
    console.error("[waitlist] insert 실패:", error.message);
    return { ok: false, error: "신청에 실패했어요. 잠시 후 다시 시도해주세요." };
  }

  return { ok: true };
}
