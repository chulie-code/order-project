import { z } from "zod";

// 옵션 그룹: 예) { name: "사이즈", choices: ["1호", "2호"] }
// DB schema 의 options jsonb: [{"name":"사이즈","choices":["1호","2호"]}, ...]
const optionGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "옵션 이름을 입력해주세요.")
    .max(30, "옵션 이름은 30자 이내로 입력해주세요."),
  choices: z
    .array(
      z
        .string()
        .trim()
        .min(1, "선택지를 입력해주세요.")
        .max(30, "선택지는 30자 이내로 입력해주세요."),
    )
    .min(1, "선택지를 1개 이상 추가해주세요.")
    .max(20, "선택지는 20개까지만 추가할 수 있어요."),
});

export type OptionGroup = z.infer<typeof optionGroupSchema>;

// 상품 폼 스키마. 가격·수량은 input type="number" 가 string 으로 줄 수 있으니 coerce.
// 이미지 파일은 FormData 별도 처리(zod 검증 대상 아님).
export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "상품 이름을 입력해주세요.")
      .max(60, "상품 이름은 60자 이내로 입력해주세요."),
    description: z
      .string()
      .trim()
      .max(500, "설명은 500자 이내로 입력해주세요."),
    price: z.coerce
      .number({ message: "가격을 숫자로 입력해주세요." })
      .int("가격은 원 단위 정수로 입력해주세요.")
      .min(0, "가격은 0원 이상이어야 해요.")
      .max(10_000_000, "가격이 너무 커요."),
    lead_time_days: z.coerce
      .number({ message: "사전주문 일수를 숫자로 입력해주세요." })
      .int()
      .min(0, "0일 이상이어야 해요.")
      .max(30, "30일 이내로 설정해주세요."),
    daily_limit: z
      .union([
        z.literal(""),
        z.coerce.number().int().min(1, "1개 이상이어야 해요.").max(9999, "9999개 이내로 입력해주세요."),
      ])
      .transform((v) => (v === "" ? null : v)),
    max_quantity_per_order: z.coerce
      .number({ message: "1회 최대 수량을 숫자로 입력해주세요." })
      .int()
      .min(1, "1개 이상이어야 해요.")
      .max(99, "99개 이내로 입력해주세요."),
    allow_lettering: z.boolean(),
    lettering_max_chars: z.coerce
      .number()
      .int()
      .min(1, "1자 이상이어야 해요.")
      .max(50, "50자 이내로 입력해주세요."),
    options: z
      .array(optionGroupSchema)
      .max(5, "옵션 그룹은 5개까지만 추가할 수 있어요."),
  })
  .superRefine((data, ctx) => {
    // 레터링 비활성이면 lettering_max_chars 는 의미 없음 — 검증 통과.
    // 활성일 때만 위 1~50 검증 적용(이미 통과).
    if (data.allow_lettering && data.lettering_max_chars < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["lettering_max_chars"],
        message: "1자 이상이어야 해요.",
      });
    }
  });

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductFormParsed = z.output<typeof productFormSchema>;

// 폼 기본값 — 케이크 공방 흔한 설정값 기준.
export function defaultProductFormValues(): ProductFormValues {
  return {
    name: "",
    description: "",
    price: 0,
    lead_time_days: 3,
    daily_limit: "",
    max_quantity_per_order: 5,
    allow_lettering: false,
    lettering_max_chars: 20,
    options: [],
  };
}

// 이미지 파일 검증 (FormData 에서 꺼낸 File[] 대상)
export const MAX_IMAGE_FILES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateImageFiles(
  files: File[],
  opts: { minCount?: number } = {},
): { error?: string } {
  const minCount = opts.minCount ?? 1;
  if (files.length < minCount) {
    return { error: `상품 사진을 ${minCount}장 이상 올려주세요.` };
  }
  if (files.length > MAX_IMAGE_FILES) {
    return { error: `사진은 ${MAX_IMAGE_FILES}장까지만 올릴 수 있어요.` };
  }
  for (const f of files) {
    if (!f.type.startsWith("image/")) {
      return { error: `이미지 파일만 올려주세요. (${f.name})` };
    }
    if (f.size > MAX_IMAGE_BYTES) {
      return { error: `사진은 5MB 이내여야 해요. (${f.name})` };
    }
  }
  return {};
}
