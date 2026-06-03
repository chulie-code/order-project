"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  PRODUCT_IMAGES_BUCKET,
  extractObjectPath,
  uploadProductImages,
} from "@/lib/storage/product-images";
import {
  MAX_IMAGE_FILES,
  productFormSchema,
  validateImageFiles,
  type ProductFormParsed,
} from "@/lib/validations/product";

type ActionResult = { error: string };

// FormData → 폼 값 + 이미지 파일 분리
// 클라이언트는 텍스트 값을 JSON 으로 직렬화해 "payload" 필드에 담아 보낸다.
// 이미지는 "images" 필드에 여러 개 들어옴.
function readFormData(formData: FormData): { payload: unknown; files: File[]; error?: string } {
  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return { payload: null, files: [], error: "잘못된 요청이에요." };
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { payload: null, files: [], error: "잘못된 요청이에요." };
  }
  const files = formData.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
  return { payload, files };
}

// 빈 문자열은 DB 에 null 로 저장 (description 등 선택 필드)
function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t.length === 0 ? null : t;
}

// 상품 등록.
// 흐름: 폼 검증 → 가게 확인 → products insert → 이미지 업로드 → images update → redirect.
// 업로드 실패 시 방금 만든 row 를 지워 롤백한다.
export async function createProduct(formData: FormData): Promise<ActionResult | void> {
  const { payload, files, error: formErr } = readFormData(formData);
  if (formErr) return { error: formErr };

  const parsed = productFormSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const imageCheck = validateImageFiles(files);
  if (imageCheck.error) return { error: imageCheck.error };

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

  const row = mapInsertRow(parsed.data, shop.id);

  const { data: inserted, error: insertErr } = await supabase
    .from("products")
    .insert(row)
    .select("id")
    .single();
  if (insertErr || !inserted) {
    return { error: "상품 등록에 실패했어요. 잠시 후 다시 시도해주세요." };
  }

  const { urls, error: uploadErr } = await uploadProductImages(
    supabase,
    shop.id,
    inserted.id,
    files,
  );
  if (uploadErr || !urls) {
    // 이미지 업로드 실패 → row 롤백
    await supabase.from("products").delete().eq("id", inserted.id);
    return { error: uploadErr ?? "이미지 업로드에 실패했어요." };
  }

  const { error: updateErr } = await supabase
    .from("products")
    .update({ images: urls })
    .eq("id", inserted.id);
  if (updateErr) {
    // images 만 못 채운 경우에도 row 는 남겨두면 사장님이 수정 화면에서 다시 시도 가능.
    return { error: "이미지를 저장하는 데 실패했어요. 상품은 등록됐어요 — 수정 화면에서 다시 시도해주세요." };
  }

  revalidatePath("/products");
  redirect("/products");
}

// 판매중 토글. RLS 가 자기 가게 상품만 update 허용하므로 추가 권한 체크 불필요.
export async function toggleProductActive(
  productId: string,
  nextActive: boolean,
): Promise<ActionResult | void> {
  if (typeof productId !== "string" || productId.length === 0) {
    return { error: "잘못된 요청이에요." };
  }
  if (typeof nextActive !== "boolean") {
    return { error: "잘못된 요청이에요." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("products")
    .update({ is_active: nextActive })
    .eq("id", productId);
  if (error) {
    return { error: "상태 변경에 실패했어요. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/products");
}

// 폼 파싱 결과 → products Insert row.
// description 빈 문자열은 null 로, daily_limit 은 null 또는 정수 그대로.
// allow_lettering=false 면 lettering_max_chars 는 의미 없지만 일관성을 위해 그대로 저장.
function mapInsertRow(data: ProductFormParsed, shopId: string) {
  return {
    shop_id: shopId,
    name: data.name,
    description: emptyToNull(data.description),
    price: data.price,
    lead_time_days: data.lead_time_days,
    daily_limit: data.daily_limit,
    max_quantity_per_order: data.max_quantity_per_order,
    allow_lettering: data.allow_lettering,
    lettering_max_chars: data.lettering_max_chars,
    options: data.options,
    images: [] as string[], // 업로드 후 update 로 채움
  };
}

// Update row: shop_id, images 는 따로 갱신하므로 제외.
function mapUpdateFields(data: ProductFormParsed) {
  return {
    name: data.name,
    description: emptyToNull(data.description),
    price: data.price,
    lead_time_days: data.lead_time_days,
    daily_limit: data.daily_limit,
    max_quantity_per_order: data.max_quantity_per_order,
    allow_lettering: data.allow_lettering,
    lettering_max_chars: data.lettering_max_chars,
    options: data.options,
  };
}

// 상품 수정.
// 흐름: 폼 검증 → 본인 상품 조회 → 남길/삭제할 기존 이미지 결정 → 새 파일 업로드
//   → DB 업데이트 → 삭제될 이미지 Storage 정리 → redirect.
// 보안: existingImages 는 반드시 DB 의 현재 images 의 부분집합이어야 한다(타 가게 URL 주입 차단).
export async function updateProduct(
  productId: string,
  formData: FormData,
): Promise<ActionResult | void> {
  if (typeof productId !== "string" || productId.length === 0) {
    return { error: "잘못된 요청이에요." };
  }

  const { payload, files, error: formErr } = readFormData(formData);
  if (formErr) return { error: formErr };

  const parsed = productFormSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  // 클라이언트가 보낸, 남기겠다고 표시한 기존 이미지 URL 들
  let existingKeep: string[] = [];
  const rawExisting = formData.get("existingImages");
  if (typeof rawExisting === "string" && rawExisting.length > 0) {
    try {
      const v = JSON.parse(rawExisting);
      if (!Array.isArray(v) || v.some((u) => typeof u !== "string")) throw new Error();
      existingKeep = v as string[];
    } catch {
      return { error: "잘못된 요청이에요." };
    }
  }

  // 새 파일: 0장 허용(기존만 남기는 경우). 단 type/size 는 검사.
  const newFileCheck = validateImageFiles(files, { minCount: 0 });
  if (newFileCheck.error) return { error: newFileCheck.error };

  const totalCount = existingKeep.length + files.length;
  if (totalCount === 0) {
    return { error: "상품 사진을 1장 이상 남겨주세요." };
  }
  if (totalCount > MAX_IMAGE_FILES) {
    return { error: `사진은 ${MAX_IMAGE_FILES}장까지만 올릴 수 있어요.` };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/products/${productId}/edit`);

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!shop) redirect("/onboarding");

  // RLS 가 본인 가게 상품만 select 허용 → 다른 가게 productId 면 null 반환.
  const { data: existing } = await supabase
    .from("products")
    .select("id, images")
    .eq("id", productId)
    .maybeSingle();
  if (!existing) {
    return { error: "상품을 찾을 수 없어요." };
  }

  // 보안: existingKeep 은 반드시 현재 images 의 부분집합이어야 한다.
  const currentImageSet = new Set(existing.images);
  for (const url of existingKeep) {
    if (!currentImageSet.has(url)) {
      return { error: "잘못된 요청이에요." };
    }
  }

  // 새 파일 업로드
  let newUrls: string[] = [];
  if (files.length > 0) {
    const { urls, error: uploadErr } = await uploadProductImages(
      supabase,
      shop.id,
      productId,
      files,
    );
    if (uploadErr || !urls) {
      return { error: uploadErr ?? "이미지 업로드에 실패했어요." };
    }
    newUrls = urls;
  }

  // DB 업데이트 — 텍스트 필드 + 최종 images 배열
  const finalImages = [...existingKeep, ...newUrls];
  const { error: updateErr } = await supabase
    .from("products")
    .update({ ...mapUpdateFields(parsed.data), images: finalImages })
    .eq("id", productId);
  if (updateErr) {
    // 새 파일은 이미 Storage 에 올라갔지만 DB 반영 실패 — 사용자에게 알리고 종료.
    // (롤백 시 또 실패할 수 있어 일단 남겨두고 사장님이 재시도하면 새 경로로 올라감)
    return { error: "상품 수정에 실패했어요. 잠시 후 다시 시도해주세요." };
  }

  // 삭제된 기존 이미지를 Storage 에서도 제거 (best-effort — 실패해도 사용자 흐름 중단 안 함)
  const toRemoveUrls = existing.images.filter((u) => !existingKeep.includes(u));
  const toRemovePaths = toRemoveUrls
    .map((u) => extractObjectPath(u))
    .filter((p): p is string => p !== null);
  if (toRemovePaths.length > 0) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(toRemovePaths);
  }

  revalidatePath("/products");
  redirect("/products");
}

// 상품 삭제.
// 흐름: 본인 상품 확인 → Storage 이미지 일괄 제거 → row 삭제 → redirect.
// Storage 제거 실패는 best-effort.
export async function deleteProduct(productId: string): Promise<ActionResult | void> {
  if (typeof productId !== "string" || productId.length === 0) {
    return { error: "잘못된 요청이에요." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("products")
    .select("id, images")
    .eq("id", productId)
    .maybeSingle();
  if (!existing) {
    return { error: "상품을 찾을 수 없어요." };
  }

  const paths = existing.images
    .map((u) => extractObjectPath(u))
    .filter((p): p is string => p !== null);
  if (paths.length > 0) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  }

  const { error: deleteErr } = await supabase.from("products").delete().eq("id", productId);
  if (deleteErr) {
    return { error: "상품 삭제에 실패했어요. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/products");
  redirect("/products");
}
