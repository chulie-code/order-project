import { z } from "zod";

// 이메일+비밀번호 로그인·가입 공용 스키마.
// (임시 로그인 수단 — 카카오 OAuth 정식 전환 전까지 사용)
export const emailAuthSchema = z.object({
  email: z.email("올바른 이메일 형식이 아니에요."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 해요."),
});

export type EmailAuthValues = z.infer<typeof emailAuthSchema>;
