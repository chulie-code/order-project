import Link from "next/link";
import { redirect } from "next/navigation";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/products");

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!shop) redirect("/onboarding");

  // RLS 가 본인 가게로 제한하지만 명시적으로 shop_id 조건도 건다(인덱스 활용).
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, images, is_active, lead_time_days, daily_limit, allow_lettering")
    .eq("shop_id", shop.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">상품 관리</h1>
        <Button asChild>
          <Link href="/products/new">+ 새 상품 등록</Link>
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <div className="mt-10 rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">아직 등록된 상품이 없어요.</p>
          <Button asChild className="mt-4">
            <Link href="/products/new">첫 상품 등록하기</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
