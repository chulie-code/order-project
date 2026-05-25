import { z } from "zod";

// 이메일+비밀번호 로그인 스키마.
// (임시 로그인 수단 — 카카오 OAuth 정식 전환 전까지 사용)
export const emailAuthSchema = z.object({
  email: z.email("올바른 이메일 형식이 아니에요."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 해요."),
});

export type EmailAuthValues = z.infer<typeof emailAuthSchema>;

// 가입 스키마: 이메일·비밀번호에 더해 베타 초대코드를 요구한다.
// 공개 가입 액션이 admin 으로 무분별하게 계정을 만들지 못하게 막는 경량 게이트.
// (정식 출시 시 임시 이메일 로그인과 함께 제거)
export const signUpSchema = emailAuthSchema.extend({
  inviteCode: z.string().trim().min(1, "베타 초대코드를 입력해주세요."),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
