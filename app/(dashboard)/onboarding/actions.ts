"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  shopSetupSchema,
  toStoredBusinessHours,
  type ShopSetupValues,
} from "@/lib/validations/shop";

type ActionResult = { error: string };

// 가게 등록: 로그인한 사장님의 shops 레코드를 생성한다.
// RLS(insert: auth.uid() = auth_user_id) 가 적용되므로 일반 서버 클라이언트 사용.
export async function createShop(values: ShopSetupValues): Promise<ActionResult | void> {
  const parsed = shopSetupSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }
  const { shop_name, slug, phone, intro, businessHours } = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const { error } = await supabase.from("shops").insert({
    auth_user_id: user.id,
    shop_name,
    slug,
    phone: phone || null,
    intro: intro || null,
    business_hours: toStoredBusinessHours(businessHours),
  });

  if (error) {
    // unique 위반(23505): slug 중복이거나 이미 내 가게가 있는 경우
    if (error.code === "23505") {
      const detail = `${error.details ?? ""} ${error.message ?? ""}`;
      if (detail.includes("slug")) {
        return { error: "이미 사용 중인 주소예요. 다른 주소를 입력해주세요." };
      }
      // auth_user_id 중복 → 이미 가게가 있음
      redirect("/dashboard");
    }
    return { error: "가게 등록에 실패했어요. 잠시 후 다시 시도해주세요." };
  }

  redirect("/dashboard");
}
