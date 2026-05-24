import Link from "next/link";

import { EmailAuthForm } from "@/components/auth/email-auth-form";
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
        <p className="text-sm text-muted-foreground">이메일로 로그인하세요</p>
      </div>

      {searchParams.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-destructive">
          로그인에 실패했어요. 잠시 후 다시 시도해주세요.
        </p>
      )}

      <EmailAuthForm mode="login" next={searchParams.next} />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        또는
        <span className="h-px flex-1 bg-border" />
      </div>

      <KakaoLoginButton next={searchParams.next} disabled />

      <p className="text-center text-sm text-muted-foreground">
        처음이신가요?{" "}
        <Link href="/signup" className="font-medium underline">
          가입하기
        </Link>
      </p>
    </div>
  );
}
