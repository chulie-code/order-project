"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { emailAuthSchema, signUpSchema } from "@/lib/validations/auth";

// ⚠️ 임시 인증 수단: 이메일+비밀번호.
// 카카오 OAuth 가 이메일 동의항목(KOE004)으로 보류된 동안 가입·가게등록을
// 끝까지 테스트하기 위한 것. 카카오 전환 시 이 액션들은 제거하면 된다.

type ActionResult = { error: string };

// 앱 내부 경로만 허용 (오픈 리다이렉트 방지).
// '/'로 시작하되 '//' 또는 '/\'(프로토콜-상대 URL)은 외부 도메인으로 빠져나갈 수
// 있어 차단한다. 예: next=//evil.com → 외부 피싱 사이트로 유도 가능.
function safeNext(next?: string) {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) {
    return next;
  }
  return "/dashboard";
}

// 가입: 이메일 인증을 건너뛰도록 admin 으로 확인된 사용자를 만든 뒤 바로 로그인.
// admin(service_role) 으로 메일 인증 없이 계정을 만들 수 있으므로, 무분별한
// 대량 가입을 막기 위해 베타 초대코드(BETA_SIGNUP_CODE)를 서버에서 검증한다.
export async function signUpWithEmail(
  values: { email: string; password: string; inviteCode: string },
): Promise<ActionResult | void> {
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }
  const { email, password, inviteCode } = parsed.data;

  // 베타 초대코드 게이트. 환경변수 미설정 시 가입을 막아(서버 오설정으로 인한
  // 무방비 공개 가입 방지) 운영자가 코드를 설정하도록 유도한다.
  const expectedCode = process.env.BETA_SIGNUP_CODE;
  if (!expectedCode || inviteCode !== expectedCode) {
    return { error: "베타 초대코드가 올바르지 않아요." };
  }

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // 이메일 인증 메일 없이 즉시 확인 처리(임시 로그인용)
  });

  if (createError) {
    const msg = createError.message.toLowerCase();
    if (createError.code === "email_exists" || msg.includes("already")) {
      return { error: "이미 가입된 이메일이에요. 로그인해주세요." };
    }
    return { error: "가입에 실패했어요. 잠시 후 다시 시도해주세요." };
  }

  // 세션 쿠키 발급
  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: "가입은 됐지만 로그인에 실패했어요. 로그인 페이지에서 다시 시도해주세요." };
  }

  // 새 사장님 → 가게 등록 단계로
  redirect("/onboarding");
}

// 로그인
export async function signInWithEmail(
  values: { email: string; password: string },
  next?: string,
): Promise<ActionResult | void> {
  const parsed = emailAuthSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }
  const { email, password } = parsed.data;

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않아요." };
  }

  redirect(safeNext(next));
}
