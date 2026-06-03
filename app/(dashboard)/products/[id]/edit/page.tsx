import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProductForm } from "@/components/products/product-form";
import { createClient } from "@/lib/supabase/server";
import {
  defaultProductFormValues,
  type OptionGroup,
  type ProductFormValues,
} from "@/lib/validations/product";

// products.options 는 jsonb — 형식이 깨졌어도 폼이 죽지 않게 안전하게 파싱.
function parseOptions(raw: unknown): OptionGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: OptionGroup[] = [];
  for (const item of raw) {
    if (item && typeof item === "object" && "name" in item && "choices" in item) {
      const name = (item as { name: unknown }).name;
      const choices = (item as { choices: unknown }).choices;
      if (
        typeof name === "string" &&
        Array.isArray(choices) &&
        choices.every((c) => typeof c === "string")
      ) {
        out.push({ name, choices });
      }
    }
  }
  return out;
}

type Props = { params: { id: string } };

export default async function EditProductPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/products/${params.id}/edit`);

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!shop) redirect("/onboarding");

  // RLS 가 본인 가게 상품만 select 허용 → 타 가게 id 면 자동으로 null.
  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, description, price, images, lead_time_days, daily_limit, max_quantity_per_order, options, allow_lettering, lettering_max_chars",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!product) notFound();

  const defaults: ProductFormValues = {
    ...defaultProductFormValues(),
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    lead_time_days: product.lead_time_days,
    daily_limit: product.daily_limit ?? "",
    max_quantity_per_order: product.max_quantity_per_order,
    allow_lettering: product.allow_lettering,
    lettering_max_chars: product.lettering_max_chars,
    options: parseOptions(product.options),
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="mb-6 space-y-1">
        <Link
          href="/products"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          ← 상품 목록
        </Link>
        <h1 className="text-2xl font-bold">상품 수정</h1>
        <p className="text-sm text-muted-foreground">정보를 수정한 뒤 변경 사항을 저장해주세요.</p>
      </div>

      <ProductForm
        mode="edit"
        productId={product.id}
        defaultValues={defaults}
        existingImages={product.images ?? []}
      />
    </main>
  );
}
