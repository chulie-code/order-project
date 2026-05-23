import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = user?.user_metadata?.name ?? user?.email ?? user?.id ?? "알 수 없음";

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">대시보드</h1>
        <LogoutButton />
      </div>

      <p className="mt-2 text-muted-foreground">오늘·이번주 예약 현황 (준비 중)</p>

      <p className="mt-4 text-sm text-muted-foreground">로그인: {displayName}</p>
    </main>
  );
}
