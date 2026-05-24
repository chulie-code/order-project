import { redirect } from "next/navigation";

import { ShopSetupForm } from "@/components/shop/shop-setup-form";
import { createClient } from "@/lib/supabase/server";

// 가입 직후 가게 정보 등록 화면. 이미 가게가 있으면 대시보드로 보낸다.
export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (shop) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">가게 정보 등록</h1>
        <p className="text-sm text-muted-foreground">
          주문 페이지를 만들기 위해 기본 정보를 입력해주세요.
        </p>
      </div>

      <ShopSetupForm />
    </main>
  );
}
