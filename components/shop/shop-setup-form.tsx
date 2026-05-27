"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { createShop } from "@/app/(dashboard)/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DAYS,
  defaultBusinessHours,
  formatPhone,
  formatSlug,
  shopSetupSchema,
  type ShopSetupValues,
} from "@/lib/validations/shop";

type SlugStatus = "idle" | "checking" | "available" | "taken";

export function ShopSetupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ShopSetupValues>({
    resolver: zodResolver(shopSetupSchema),
    defaultValues: {
      shop_name: "",
      slug: "",
      phone: "",
      intro: "",
      businessHours: defaultBusinessHours(),
    },
  });

  const slug = watch("slug");
  const businessHours = watch("businessHours");
  const slugPreview = (slug || "your-shop").toLowerCase();

  // 입력 중 실시간 정리: register 의 onChange 를 가로채 값을 가공한 뒤 넘긴다.
  const slugField = register("slug");
  const phoneField = register("phone");

  // 월요일 영업시간(휴무 여부 포함)을 화~금에 그대로 복사한다.
  function applyWeekdays() {
    const mon = getValues("businessHours.mon");
    (["tue", "wed", "thu", "fri"] as const).forEach((key) => {
      setValue(`businessHours.${key}`, { ...mon }, { shouldValidate: true, shouldDirty: true });
    });
  }

  // slug 실시간 중복 체크 (디바운스 400ms). 형식이 유효할 때만 서버 조회.
  useEffect(() => {
    const s = (slug || "").trim().toLowerCase();
    const fmt = shopSetupSchema.shape.slug.safeParse(s);
    if (!fmt.success) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shops/check-slug?slug=${encodeURIComponent(s)}`);
        const json = (await res.json()) as { available: boolean };
        setSlugStatus(json.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [slug]);

  async function onSubmit(values: ShopSetupValues) {
    setServerError(null);
    if (slugStatus === "taken") {
      setServerError("이미 사용 중인 주소예요. 다른 주소를 입력해주세요.");
      return;
    }
    // 성공하면 서버 액션이 /dashboard 로 redirect 한다.
    const result = await createShop(values);
    if (result?.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="shop_name">가게 이름</Label>
        <Input id="shop_name" placeholder="예) 오늘의 케이크" {...register("shop_name")} />
        {errors.shop_name && (
          <p className="text-sm text-destructive">{errors.shop_name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">주문 페이지 주소</Label>
        <Input
          id="slug"
          placeholder="todays-cake"
          autoCapitalize="none"
          {...slugField}
          onChange={(e) => {
            e.target.value = formatSlug(e.target.value);
            void slugField.onChange(e);
          }}
        />
        <p className="text-xs text-muted-foreground">
          고객이 접속할 주소예요: <span className="font-mono">/{slugPreview}</span> · 영문 소문자,
          숫자, 하이픈(-)
        </p>
        {errors.slug ? (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        ) : slugStatus === "checking" ? (
          <p className="text-sm text-muted-foreground">주소 확인 중…</p>
        ) : slugStatus === "available" ? (
          <p className="text-sm text-green-600">사용 가능한 주소예요 ✓</p>
        ) : slugStatus === "taken" ? (
          <p className="text-sm text-destructive">이미 사용 중인 주소예요.</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">전화번호 (선택)</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="numeric"
          placeholder="010-1234-5678"
          {...phoneField}
          onChange={(e) => {
            e.target.value = formatPhone(e.target.value);
            void phoneField.onChange(e);
          }}
        />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="intro">가게 소개 (선택)</Label>
        <Textarea
          id="intro"
          rows={3}
          placeholder="주문 페이지 상단에 보여질 한 줄 소개"
          {...register("intro")}
        />
        {errors.intro && <p className="text-sm text-destructive">{errors.intro.message}</p>}
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 flex w-full flex-wrap items-center justify-between gap-2 text-sm font-medium">
          <span>영업시간</span>
          <button
            type="button"
            onClick={applyWeekdays}
            className="font-normal text-xs text-primary underline-offset-2 hover:underline"
          >
            월요일과 같게 (화~금)
          </button>
        </legend>
        {DAYS.map(({ key, label }) => {
          const closed = businessHours?.[key]?.closed;
          const closeError = errors.businessHours?.[key]?.close?.message;
          return (
            <div key={key} className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="w-5 shrink-0 text-sm font-medium">{label}</span>
                <label className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    {...register(`businessHours.${key}.closed` as const)}
                  />
                  휴무
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="time"
                    aria-label={`${label}요일 영업 시작`}
                    disabled={closed}
                    className="h-9 w-[7.5rem]"
                    {...register(`businessHours.${key}.open` as const)}
                  />
                  <span className="text-muted-foreground">~</span>
                  <Input
                    type="time"
                    aria-label={`${label}요일 영업 종료`}
                    disabled={closed}
                    className="h-9 w-[7.5rem]"
                    {...register(`businessHours.${key}.close` as const)}
                  />
                </div>
              </div>
              {!closed && closeError && (
                <p className="pl-8 text-sm text-destructive">{closeError}</p>
              )}
            </div>
          );
        })}
      </fieldset>

      {serverError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-destructive">{serverError}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || slugStatus === "checking" || slugStatus === "taken"}
      >
        {isSubmitting ? "등록 중…" : "가게 등록하고 시작하기"}
      </Button>
    </form>
  );
}
