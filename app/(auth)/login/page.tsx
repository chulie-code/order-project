import Link from "next/link";

import { KakaoLoginButton } from "@/components/auth/kakao-login-button";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">사장님 로그인</h1>
        <p className="text-sm text-muted-foreground">카카오 계정으로 간편하게 시작하세요</p>
      </div>

      {searchParams.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-destructive">
          로그인에 실패했어요. 잠시 후 다시 시도해주세요.
        </p>
      )}

      <KakaoLoginButton next={searchParams.next} label="카카오로 로그인" />

      <p className="text-center text-sm text-muted-foreground">
        처음이신가요?{" "}
        <Link href="/signup" className="font-medium underline">
          가입하기
        </Link>
      </p>
    </div>
  );
}
