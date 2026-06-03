import Link from "next/link";
import { redirect } from "next/navigation";

import { ProductForm } from "@/components/products/product-form";
import { createClient } from "@/lib/supabase/server";

// 상품 등록 화면. 가게가 없으면 온보딩으로 보낸다.
export default async function NewProductPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/products/new");

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!shop) redirect("/onboarding");

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="mb-6 space-y-1">
        <Link
          href="/products"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          ← 상품 목록
        </Link>
        <h1 className="text-2xl font-bold">새 상품 등록</h1>
        <p className="text-sm text-muted-foreground">
          고객 주문 페이지에 노출될 상품 정보를 입력해주세요.
        </p>
      </div>

      <ProductForm mode="create" />
    </main>
  );
}
