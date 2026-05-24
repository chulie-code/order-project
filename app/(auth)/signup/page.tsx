import Link from "next/link";

import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { KakaoLoginButton } from "@/components/auth/kakao-login-button";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">사장님 가입</h1>
        <p className="text-sm text-muted-foreground">이메일로 가입하면 바로 시작할 수 있어요</p>
      </div>

      <EmailAuthForm mode="signup" />

      <p className="text-center text-xs text-muted-foreground">
        가입 후 가게 정보 등록 단계가 이어집니다.
      </p>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        또는
        <span className="h-px flex-1 bg-border" />
      </div>

      <KakaoLoginButton label="카카오로 시작하기" disabled />

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
