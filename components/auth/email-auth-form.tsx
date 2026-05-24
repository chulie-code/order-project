"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { signInWithEmail, signUpWithEmail } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailAuthSchema, type EmailAuthValues } from "@/lib/validations/auth";

// 임시 이메일+비밀번호 로그인/가입 폼. mode 로 동작을 구분한다.
export function EmailAuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailAuthValues>({
    resolver: zodResolver(emailAuthSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: EmailAuthValues) {
    setServerError(null);
    // 성공하면 서버 액션이 redirect 하므로, 반환값이 오면 실패한 경우다.
    const result =
      mode === "login" ? await signInWithEmail(values, next) : await signUpWithEmail(values);
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

      {serverError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
      </Button>
    </form>
  );
}
