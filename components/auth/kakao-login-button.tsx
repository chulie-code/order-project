"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// 카카오 OAuth 로그인 시작 버튼.
// 클릭하면 Supabase 가 카카오 인증 페이지로 리다이렉트하고,
// 인증 후 /auth/callback 으로 돌아와 세션을 만든다.
export function KakaoLoginButton({
  next,
  label = "카카오로 로그인",
  disabled = false,
}: {
  next?: string;
  label?: string;
  // 카카오 이메일 동의항목(KOE004) 보류 동안 "준비 중"으로 비활성화.
  // 이메일 동의가 풀리면 이 prop 만 제거하면 정상 동작한다.
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  if (disabled) {
    return (
      <Button
        type="button"
        disabled
        className="w-full bg-[#FEE500] text-[#191600] hover:bg-[#FADA0A]"
      >
        {label} (준비 중)
      </Button>
    );
  }

  async function handleLogin() {
    setLoading(true);
    const supabase = createClient();

    const callback = new URL("/auth/callback", window.location.origin);
    if (next) callback.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: callback.toString() },
    });

    // 성공하면 카카오로 리다이렉트되므로 아래는 실패한 경우만 실행된다.
    if (error) {
      setLoading(false);
      alert("로그인을 시작할 수 없어요. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <Button
      onClick={handleLogin}
      disabled={loading}
      className="w-full bg-[#FEE500] text-[#191600] hover:bg-[#FADA0A]"
    >
      {loading ? "이동 중…" : label}
    </Button>
  );
}
