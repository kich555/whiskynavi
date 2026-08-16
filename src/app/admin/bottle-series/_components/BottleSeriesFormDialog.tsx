"use client";

import type { AdminBottleSeriesResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IMAGE_FILE_ACCEPT } from "@/lib/image-upload";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { MAX_BOTTLE_IMAGE_SIZE_MB } from "../../products/image-constraints";
import { saveBottleSeriesAction, type BottleSeriesFormState } from "../actions";

interface BottleSeriesFormDialogProps {
  open: boolean;
  series: AdminBottleSeriesResponse | null;
  onOpenChange: (open: boolean) => void;
}

const initialState: BottleSeriesFormState = { success: false };

export default function BottleSeriesFormDialog({ open, series, onOpenChange }: BottleSeriesFormDialogProps) {
  const router = useRouter();
  const seriesId = series?.id ?? null;
  const action = useMemo(() => saveBottleSeriesAction.bind(null, seriesId), [seriesId]);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.success) return;
    toast.success(seriesId === null ? "보틀 시리즈를 등록했습니다." : "보틀 시리즈를 수정했습니다.");
    onOpenChange(false);
    router.refresh();
  }, [onOpenChange, router, seriesId, state.success]);

  const title = seriesId === null ? "보틀 시리즈 등록" : "보틀 시리즈 수정";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="typo-bold-20">{title}</DialogTitle>
          <DialogDescription>브랜드와 시리즈 정보를 입력하고 공개 API 노출 여부를 설정합니다.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="bottle-series-brand" className="typo-medium-14 text-gray-700">
                브랜드명 <span className="text-red-500">*</span>
              </label>
              <Input
                id="bottle-series-brand"
                name="brand"
                maxLength={50}
                required
                defaultValue={series?.brand ?? ""}
                placeholder="예: Macallan"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="bottle-series-name" className="typo-medium-14 text-gray-700">
                시리즈명 <span className="text-red-500">*</span>
              </label>
              <Input
                id="bottle-series-name"
                name="series"
                maxLength={50}
                required
                defaultValue={series?.series ?? ""}
                placeholder="예: Double Cask"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bottle-series-description" className="typo-medium-14 text-gray-700">
              설명
            </label>
            <Textarea
              id="bottle-series-description"
              name="description"
              defaultValue={series?.description ?? ""}
              placeholder="시리즈에 대한 설명을 입력하세요."
              className="min-h-28 resize-y"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="bottle-series-image" className="typo-medium-14 text-gray-700">
                대표 이미지
              </label>
              <Input id="bottle-series-image" name="imageFile" type="file" accept={IMAGE_FILE_ACCEPT} />
              <input type="hidden" name="imageKey" value={series?.imageKey ?? ""} />
              <p className="typo-medium-12 text-gray-500">JPG, PNG, WEBP · 최대 {MAX_BOTTLE_IMAGE_SIZE_MB}MB</p>
              {series?.imageUrl ? (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    <ImageWithFallback
                      src={series.imageUrl}
                      alt={`${series.brand ?? ""} ${series.series ?? ""}`.trim()}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <label className="typo-medium-14 flex cursor-pointer items-center gap-2 text-gray-600">
                    <input type="checkbox" name="removeImage" className="size-4 accent-red-600" />
                    기존 이미지 제거
                  </label>
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="representative-bottle-id" className="typo-medium-14 text-gray-700">
                대표 보틀 ID
              </label>
              <Input
                id="representative-bottle-id"
                name="representativeBottleId"
                type="number"
                min={1}
                step={1}
                defaultValue={series?.representativeBottleId ?? ""}
                placeholder="예: 123"
              />
              <p className="typo-medium-12 text-gray-500">시리즈를 대표할 보틀의 관리자 ID를 입력합니다.</p>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <input
              type="checkbox"
              name="visible"
              defaultChecked={series?.visible ?? true}
              className="size-4 accent-amber-600"
            />
            <span>
              <span className="typo-medium-14 block text-gray-900">공개 API에 노출</span>
              <span className="typo-medium-12 mt-1 block text-gray-500">
                활성화하면 사용자용 브랜드·시리즈 목록에 표시됩니다.
              </span>
            </span>
          </label>

          {state.error ? (
            <p role="alert" className="typo-medium-14 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600">
              {state.error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              취소
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={isPending}>
              {isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
