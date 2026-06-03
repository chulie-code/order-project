import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { createClient } from "@/lib/supabase/server";

// (dashboard) 그룹 공통 레이아웃 — 상단 헤더 + 네비 탭.
// 가게가 아직 없는 경우(/onboarding) 에는 네비를 감춰 가입 직후 흐름을 단순하게 유지한다.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("shop_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href={shop ? "/dashboard" : "/onboarding"}
            className="text-base font-bold tracking-tight"
          >
            {shop?.shop_name ?? "오더레터"}
          </Link>
          <LogoutButton />
        </div>
        {shop && <DashboardNav />}
      </header>
      {children}
    </div>
  );
}
