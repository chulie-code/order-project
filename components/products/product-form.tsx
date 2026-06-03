"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";

import { createProduct, updateProduct } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_IMAGE_FILES,
  defaultProductFormValues,
  productFormSchema,
  type ProductFormValues,
} from "@/lib/validations/product";

// discriminated union 으로 등록/수정 모드를 깔끔하게 구분한다.
type ProductFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      productId: string;
      defaultValues: ProductFormValues;
      existingImages: string[];
    };

export function ProductForm(props: ProductFormProps) {
  const isEdit = props.mode === "edit";

  const [serverError, setServerError] = useState<string | null>(null);
  // 새로 추가할 파일들
  const [files, setFiles] = useState<File[]>([]);
  // 수정 모드에서 "남길" 기존 이미지 URL들. 등록 모드면 빈 배열.
  const [existingUrls, setExistingUrls] = useState<string[]>(
    props.mode === "edit" ? props.existingImages : [],
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: props.mode === "edit" ? props.defaultValues : defaultProductFormValues(),
  });

  const allowLettering = watch("allow_lettering");
  const totalImages = existingUrls.length + files.length;

  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  // 메모리 누수 방지: 다음 미리보기 생성 시(또는 언마운트 시) 이전 URL 해제.
  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previewUrls]);

  function handleFilesAdded(picked: FileList | null) {
    if (!picked || picked.length === 0) return;
    const incoming = Array.from(picked);
    const remainingSlots = MAX_IMAGE_FILES - totalImages;
    const merged = [...files, ...incoming.slice(0, Math.max(0, remainingSlots))];
    setFiles(merged);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleNewFileRemove(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleExistingRemove(idx: number) {
    setExistingUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(values: ProductFormValues) {
    setServerError(null);
    setImageError(null);

    if (totalImages === 0) {
      setImageError("상품 사진을 1장 이상 남겨주세요.");
      return;
    }

    const fd = new FormData();
    fd.append("payload", JSON.stringify(values));
    files.forEach((f) => fd.append("images", f));

    if (props.mode === "edit") {
      fd.append("existingImages", JSON.stringify(existingUrls));
      const result = await updateProduct(props.productId, fd);
      if (result?.error) setServerError(result.error);
    } else {
      const result = await createProduct(fd);
      if (result?.error) setServerError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* 기본 정보 */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">상품 이름</Label>
          <Input id="name" placeholder="예) 클래식 당근 케이크 1호" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">설명 (선택)</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="재료, 사이즈, 보관 방법 등 고객이 알아두면 좋은 정보"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price">가격 (원)</Label>
          <Input
            id="price"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            placeholder="45000"
            {...register("price")}
          />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>
      </section>

      {/* 사진 (기존 + 새로 추가 통합) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>상품 사진</Label>
          <span className="text-xs text-muted-foreground">
            {totalImages}/{MAX_IMAGE_FILES}장 · 5MB 이내
          </span>
        </div>

        {totalImages > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {existingUrls.map((url, i) => (
              <li key={`existing-${url}`} className="relative">
                <div className="relative aspect-square w-full overflow-hidden rounded-md border bg-muted">
                  <Image src={url} alt="" fill className="object-cover" sizes="25vw" />
                </div>
                <button
                  type="button"
                  onClick={() => handleExistingRemove(i)}
                  aria-label={`기존 사진 ${i + 1} 삭제`}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
                >
                  삭제
                </button>
              </li>
            ))}
            {files.map((f, i) => (
              <li key={`new-${f.name}-${i}`} className="relative">
                {/* 새로 선택한 파일은 blob URL — next/image 대신 일반 img */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrls[i]}
                  alt=""
                  className="aspect-square w-full rounded-md border object-cover"
                />
                <span className="absolute left-1 top-1 rounded bg-primary/80 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  새 사진
                </span>
                <button
                  type="button"
                  onClick={() => handleNewFileRemove(i)}
                  aria-label={`새 사진 ${i + 1} 삭제`}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}

        {totalImages < MAX_IMAGE_FILES && (
          <div>
            <input
              ref={fileInputRef}
              id="images"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => handleFilesAdded(e.target.files)}
            />
            <label
              htmlFor="images"
              className="flex h-24 cursor-pointer items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground hover:bg-accent"
            >
              사진 추가하기 (탭하여 선택)
            </label>
          </div>
        )}

        {imageError && <p className="text-sm text-destructive">{imageError}</p>}
      </section>

      {/* 주문 조건 */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lead_time_days">사전주문 일수 (일)</Label>
            <Input
              id="lead_time_days"
              type="number"
              inputMode="numeric"
              min={0}
              max={30}
              {...register("lead_time_days")}
            />
            <p className="text-xs text-muted-foreground">
              0이면 당일, 3이면 3일 전까지 주문 가능
            </p>
            {errors.lead_time_days && (
              <p className="text-sm text-destructive">{errors.lead_time_days.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="daily_limit">일별 한도 (선택)</Label>
            <Input
              id="daily_limit"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="비우면 무제한"
              {...register("daily_limit")}
            />
            {errors.daily_limit && (
              <p className="text-sm text-destructive">{errors.daily_limit.message}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="max_quantity_per_order">1회 최대 수량</Label>
            <Input
              id="max_quantity_per_order"
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              {...register("max_quantity_per_order")}
            />
            {errors.max_quantity_per_order && (
              <p className="text-sm text-destructive">
                {errors.max_quantity_per_order.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 옵션 그룹 */}
      <OptionGroups
        control={control}
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
      />

      {/* 레터링 */}
      <section className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">레터링 가능</p>
            <p className="text-xs text-muted-foreground">고객이 케이크에 올릴 글자를 입력해요</p>
          </div>
          <Controller
            control={control}
            name="allow_lettering"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label="레터링 가능 여부"
              />
            )}
          />
        </div>

        {allowLettering && (
          <div className="space-y-1.5">
            <Label htmlFor="lettering_max_chars">레터링 최대 글자수</Label>
            <Input
              id="lettering_max_chars"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              {...register("lettering_max_chars")}
            />
            {errors.lettering_max_chars && (
              <p className="text-sm text-destructive">{errors.lettering_max_chars.message}</p>
            )}
          </div>
        )}
      </section>

      {serverError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? isEdit
            ? "저장 중…"
            : "등록 중…"
          : isEdit
            ? "변경 사항 저장하기"
            : "상품 등록하기"}
      </Button>
    </form>
  );
}

// 옵션 그룹: 이름 + 선택지 배열. 그룹은 useFieldArray, 그룹 안 choices 는
// watch+setValue 로 직접 다룬다 (RHF 의 useFieldArray 는 원시 배열엔 못 씀).
function OptionGroups(props: {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}) {
  const { control, register, watch, setValue, errors } = props;
  const { fields, append, remove } = useFieldArray({ control, name: "options" });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>옵션 (선택)</Label>
        {fields.length < 5 && (
          <button
            type="button"
            onClick={() => append({ name: "", choices: [""] })}
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            + 옵션 그룹 추가
          </button>
        )}
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">
          예) 사이즈(1호·2호), 맛(딸기·초코) — 고객이 주문 시 골라요.
        </p>
      )}

      {fields.map((field, gIdx) => {
        const choices = watch(`options.${gIdx}.choices`) ?? [];
        const groupError = errors.options?.[gIdx];
        return (
          <div key={field.id} className="space-y-3 rounded-md border p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`options.${gIdx}.name`} className="text-xs">
                  그룹 이름
                </Label>
                <Input
                  id={`options.${gIdx}.name`}
                  placeholder="예) 사이즈"
                  {...register(`options.${gIdx}.name` as const)}
                />
                {groupError?.name && (
                  <p className="text-sm text-destructive">{groupError.name.message}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(gIdx)}
                aria-label="옵션 그룹 삭제"
              >
                삭제
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">선택지</Label>
              {choices.map((_, cIdx) => (
                <div key={cIdx} className="flex items-center gap-2">
                  <Input
                    placeholder="예) 1호"
                    {...register(`options.${gIdx}.choices.${cIdx}` as const)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={choices.length <= 1}
                    onClick={() => {
                      const next = choices.filter((_, i) => i !== cIdx);
                      setValue(`options.${gIdx}.choices`, next, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    aria-label={`선택지 ${cIdx + 1} 삭제`}
                  >
                    −
                  </Button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setValue(`options.${gIdx}.choices`, [...choices, ""], {
                    shouldValidate: false,
                    shouldDirty: true,
                  });
                }}
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                + 선택지 추가
              </button>
              {groupError?.choices && !Array.isArray(groupError.choices) && (
                <p className="text-sm text-destructive">{groupError.choices.message}</p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
