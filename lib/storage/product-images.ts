import "server-only";

import { randomUUID } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

// public 버킷. Supabase 콘솔에서 미리 생성해두어야 함.
export const PRODUCT_IMAGES_BUCKET = "product-images";

// 파일명에 한글·공백·특수문자가 있으면 URL 인코딩이 깨질 수 있어
// 확장자만 살리고 앞부분을 무작위 UUID 로 대체한다.
// 경로 첫 폴더는 shop_id 로 두어 Storage RLS 가 동작하게 한다.
//   예) {shopId}/{productId}-{uuid}.jpg
function buildObjectPath(shopId: string, productId: string, file: File): string {
  const dot = file.name.lastIndexOf(".");
  const rawExt = dot >= 0 ? file.name.slice(dot + 1) : "";
  const safeExt = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase() || "bin";
  return `${shopId}/${productId}-${randomUUID()}.${safeExt}`;
}

// 파일들을 product-images 버킷에 업로드하고 public URL 배열을 돌려준다.
// 실패 시 첫 에러에서 중단 — 이미 올라간 파일은 그대로 둔다(다음 요청 때 재시도되거나
// 사장님이 삭제 흐름에서 정리). 트랜잭션이 아니므로 호출자가 row 정리를 책임진다.
export async function uploadProductImages(
  supabase: SupabaseClient<Database>,
  shopId: string,
  productId: string,
  files: File[],
): Promise<{ urls?: string[]; error?: string }> {
  const urls: string[] = [];
  for (const file of files) {
    const path = buildObjectPath(shopId, productId, file);
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (error) {
      return { error: `이미지 업로드에 실패했어요. (${error.message})` };
    }
    const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return { urls };
}

// 단계 3(수정·삭제)에서 사용할 예정 — public URL 에서 Storage object key 만 추출.
// 다른 도메인 URL 이거나 형식이 맞지 않으면 null.
export function extractObjectPath(publicUrl: string): string | null {
  const marker = `/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx < 0) return null;
  return publicUrl.slice(idx + marker.length);
}
