import { z } from "zod";

// 주문 페이지 주소(slug)로 쓸 수 없는 예약어 — 앱의 다른 경로와 충돌 방지.
export const RESERVED_SLUGS = [
  "login",
  "signup",
  "dashboard",
  "products",
  "orders",
  "settings",
  "onboarding",
  "api",
  "auth",
  "admin",
  "checkout",
  "complete",
];

// 영업시간 입력에 쓰는 요일 정의 (월~일 순)
export const DAYS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
] as const;

export type DayKey = (typeof DAYS)[number]["key"];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM (24시간)

const dayHoursSchema = z
  .object({
    closed: z.boolean(),
    open: z.string().regex(TIME_RE, "시간 형식이 올바르지 않아요."),
    close: z.string().regex(TIME_RE, "시간 형식이 올바르지 않아요."),
  })
  // 영업일이면 종료가 시작보다 늦어야 한다.
  .refine((d) => d.closed || d.open < d.close, {
    message: "종료 시간이 시작 시간보다 늦어야 해요.",
    path: ["close"],
  });

export type DayHours = z.infer<typeof dayHoursSchema>;

// 가게 등록 폼 스키마. 필수는 가게 이름 + slug, 전화/소개는 선택(빈 값 허용).
export const shopSetupSchema = z.object({
  shop_name: z
    .string()
    .trim()
    .min(1, "가게 이름을 입력해주세요.")
    .max(40, "가게 이름은 40자 이내로 입력해주세요."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "주소는 3자 이상이어야 해요.")
    .max(30, "주소는 30자 이내로 입력해주세요.")
    .regex(/^[a-z0-9-]+$/, "영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.")
    .refine((s) => !s.startsWith("-") && !s.endsWith("-"), "하이픈으로 시작하거나 끝낼 수 없어요.")
    .refine((s) => !RESERVED_SLUGS.includes(s), "사용할 수 없는 주소예요. 다른 주소를 입력해주세요."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9-]*$/, "숫자와 하이픈(-)만 입력해주세요.")
    .max(20, "전화번호가 너무 길어요."),
  intro: z.string().trim().max(200, "소개는 200자 이내로 입력해주세요."),
  businessHours: z.object({
    mon: dayHoursSchema,
    tue: dayHoursSchema,
    wed: dayHoursSchema,
    thu: dayHoursSchema,
    fri: dayHoursSchema,
    sat: dayHoursSchema,
    sun: dayHoursSchema,
  }),
});

export type ShopSetupValues = z.infer<typeof shopSetupSchema>;

// 폼 기본값: 월~토 10:00~19:00 영업, 일요일 휴무 (베이커리 일반값)
export function defaultBusinessHours(): ShopSetupValues["businessHours"] {
  const open = { closed: false, open: "10:00", close: "19:00" };
  return {
    mon: { ...open },
    tue: { ...open },
    wed: { ...open },
    thu: { ...open },
    fri: { ...open },
    sat: { ...open },
    sun: { closed: true, open: "10:00", close: "19:00" },
  };
}

// 폼 값 → DB 저장 형식. 휴무일은 제외하고 {"mon":{"open","close"}} 형태로.
// (CLAUDE.md 스키마 주석의 business_hours 형식)
export function toStoredBusinessHours(
  hours: ShopSetupValues["businessHours"],
): Record<string, { open: string; close: string }> {
  const result: Record<string, { open: string; close: string }> = {};
  for (const { key } of DAYS) {
    const d = hours[key];
    if (!d.closed) result[key] = { open: d.open, close: d.close };
  }
  return result;
}
