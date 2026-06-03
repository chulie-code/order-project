"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

import { deleteProduct, toggleProductActive } from "@/app/(dashboard)/products/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/database";

type Props = {
  product: Pick<
    Product,
    | "id"
    | "name"
    | "price"
    | "images"
    | "is_active"
    | "lead_time_days"
    | "daily_limit"
    | "allow_lettering"
  >;
};

const wonFormatter = new Intl.NumberFormat("ko-KR");

export function ProductCard({ product }: Props) {
  const [active, setActive] = useState(product.is_active);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [deletePending, startDelete] = useTransition();

  function onToggle(next: boolean) {
    const prev = active;
    setActive(next); // 낙관적 업데이트
    setErr(null);
    startTransition(async () => {
      const result = await toggleProductActive(product.id, next);
      if (result?.error) {
        setActive(prev); // 실패 시 롤백
        setErr(result.error);
      }
    });
  }

  function onDelete() {
    setErr(null);
    startDelete(async () => {
      const result = await deleteProduct(product.id);
      // 성공이면 서버 액션이 /products 로 redirect → 페이지 새로고침
      if (result?.error) setErr(result.error);
    });
  }

  const cover = product.images?.[0] ?? null;

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-md border bg-card transition-opacity",
        !active && "opacity-60",
      )}
    >
      <div className="relative aspect-square w-full bg-muted">
        {cover ? (
          <Image
            src={cover}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            사진 없음
          </div>
        )}
        {!active && (
          <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            판매 중단
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>
          <Switch
            checked={active}
            onCheckedChange={onToggle}
            disabled={pending}
            aria-label={`${product.name} 판매중 토글`}
          />
        </div>
        <p className="text-sm font-semibold">₩{wonFormatter.format(product.price)}</p>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {product.lead_time_days > 0 && <span>{product.lead_time_days}일 전 예약</span>}
          {product.daily_limit && <span>일 {product.daily_limit}개</span>}
          {product.allow_lettering && <span>레터링</span>}
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}

        <div className="mt-auto flex items-center gap-2 border-t pt-2">
          <Button asChild variant="ghost" size="sm" className="flex-1">
            <Link href={`/products/${product.id}/edit`}>수정</Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={deletePending}
              >
                {deletePending ? "삭제 중…" : "삭제"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>이 상품을 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{product.name}&rdquo; 상품과 등록된 사진이 모두 영구 삭제돼요. 되돌릴 수
                  없어요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제하기
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </article>
  );
}
