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
}: {
  next?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

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
