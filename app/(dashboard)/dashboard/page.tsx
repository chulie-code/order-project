import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  // 가게 미등록 사장님은 온보딩으로
  const { data: shop } = await supabase
    .from("shops")
    .select("shop_name, slug, subscription_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!shop) redirect("/onboarding");

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">대시보드</h1>

      <div className="mt-4 rounded-lg border p-4">
        <p className="text-lg font-semibold">{shop.shop_name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          주문 페이지:{" "}
          <Link href={`/${shop.slug}`} className="font-mono underline">
            /{shop.slug}
          </Link>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">구독 상태: {shop.subscription_status}</p>
      </div>

      <p className="mt-6 text-muted-foreground">오늘·이번주 예약 현황 (준비 중)</p>
    </main>
  );
}
