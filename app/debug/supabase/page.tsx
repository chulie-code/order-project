import { createClient } from "@/lib/supabase/server";

// 항상 요청 시점에 실행 (빌드 때 미리 렌더링하지 않음)
export const dynamic = "force-dynamic";

type CheckResult = {
  status: "ok" | "error" | "skipped";
  detail: string;
  count: number | null;
};

async function checkConnection(envReady: boolean): Promise<CheckResult> {
  if (!envReady) {
    return { status: "skipped", detail: "환경변수 미설정", count: null };
  }
  try {
    const supabase = createClient();
    // shops 테이블 개수만 조회(head: true → 데이터 없이 count 만).
    // 에러 없이 응답하면 연결·스키마·키가 모두 정상이라는 뜻.
    const { count, error } = await supabase
      .from("shops")
      .select("*", { count: "exact", head: true });

    if (error) {
      return { status: "error", detail: error.message, count: null };
    }
    return { status: "ok", detail: "정상 연결됨", count: count ?? 0 };
  } catch (e) {
    return {
      status: "error",
      detail: e instanceof Error ? e.message : String(e),
      count: null,
    };
  }
}

function Row({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between border-b py-2 last:border-b-0">
      <span>{label}</span>
      <span className={ok ? "text-green-600" : "text-destructive"}>
        {ok ? "✓ 설정됨" : "✗ 비어있음"}
      </span>
    </li>
  );
}

export default async function SupabaseTestPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const hasUrl = url.length > 0;
  const hasAnon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").length > 0;
  const hasService = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").length > 0;
  const envReady = hasUrl && hasAnon;

  const result = await checkConnection(envReady);

  const banner = {
    ok: { cls: "bg-green-50 text-green-700 border-green-200", text: "✅ Supabase 연결 성공" },
    error: { cls: "bg-red-50 text-destructive border-red-200", text: "❌ 연결 실패" },
    skipped: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      text: "⚠️ 환경변수를 먼저 채워주세요",
    },
  }[result.status];

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold">Supabase 연결 테스트</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          개발용 진단 페이지입니다. 확인이 끝나면 <code>app/debug</code> 폴더는 삭제해도 됩니다.
        </p>
      </div>

      <div className={`rounded-lg border p-4 font-medium ${banner.cls}`}>{banner.text}</div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">환경변수 (.env.local)</h2>
        <ul className="rounded-lg border px-4 text-sm">
          <Row label="NEXT_PUBLIC_SUPABASE_URL" ok={hasUrl} />
          <Row label="NEXT_PUBLIC_SUPABASE_ANON_KEY" ok={hasAnon} />
          <Row label="SUPABASE_SERVICE_ROLE_KEY" ok={hasService} />
        </ul>
        {hasUrl && <p className="mt-2 break-all text-xs text-muted-foreground">URL: {url}</p>}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">DB 조회 (shops 테이블)</h2>
        <div className="rounded-lg border p-4 text-sm">
          {result.status === "ok" && (
            <>
              <p>
                shops 행 수: <strong>{result.count}</strong>개
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                로그인하지 않은 상태에서는 RLS 정책상 0개가 정상입니다. 에러 없이 응답하면 연결
                성공이에요.
              </p>
            </>
          )}
          {result.status === "error" && (
            <>
              <p className="text-destructive">에러: {result.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                키가 맞는지, Supabase SQL Editor 에서 schema.sql 을 실행했는지 확인해주세요.
              </p>
            </>
          )}
          {result.status === "skipped" && (
            <p className="text-muted-foreground">
              .env.local 에 키를 채우고 dev 서버를 재시작하면 여기서 연결 결과를 확인할 수 있습니다.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
