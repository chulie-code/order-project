"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { signInWithEmail, signUpWithEmail } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailAuthSchema, signUpSchema, type SignUpValues } from "@/lib/validations/auth";

// 임시 이메일+비밀번호 로그인/가입 폼. mode 로 동작을 구분한다.
// 가입 모드에서는 베타 초대코드 입력을 추가로 받는다(서버에서 최종 검증).
export function EmailAuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isSignup = mode === "signup";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    // 로그인 모드는 초대코드를 검증하지 않으므로 emailAuthSchema 사용.
    // (두 스키마의 필드 집합이 달라 unknown 경유 캐스팅 — 런타임 동작은 모드별로 정확)
    resolver: zodResolver(isSignup ? signUpSchema : emailAuthSchema) as unknown as Resolver<SignUpValues>,
    defaultValues: { email: "", password: "", inviteCode: "" },
  });

  async function onSubmit(values: SignUpValues) {
    setServerError(null);
    // 성공하면 서버 액션이 redirect 하므로, 반환값이 오면 실패한 경우다.
    const result = isSignup
      ? await signUpWithEmail(values)
      : await signInWithEmail({ email: values.email, password: values.password }, next);
    if (result?.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="owner@example.com"
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="6자 이상"
          {...register("password")}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {isSignup && (
        <div className="space-y-1.5">
          <Label htmlFor="inviteCode">베타 초대코드</Label>
          <Input
            id="inviteCode"
            autoComplete="off"
            placeholder="발급받은 초대코드"
            {...register("inviteCode")}
          />
          {errors.inviteCode && (
            <p className="text-sm text-destructive">{errors.inviteCode.message}</p>
          )}
        </div>
      )}

      {serverError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
      </Button>
    </form>
  );
}
