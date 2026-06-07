"use client";

import type { AdminBannerResponse } from "@/apis/generated/api";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";
import { deleteBannerAction, publishBannerAction, unpublishBannerAction, updateBannerOrdersAction } from "../actions";

interface BannersContentProps {
  searchParams: {
    page?: string;
    limit?: string;
  };
  banners: AdminBannerResponse[];
  totalElements: number;
}

export default function BannersContent({ searchParams, banners, totalElements }: BannersContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 12;
  const orderedBanners = useMemo(
    () => [...banners].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.id ?? 0) - (b.id ?? 0)),
    [banners],
  );

  const runAction = (action: () => Promise<{ success: boolean; error?: string }>, successMessage: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(successMessage);
        router.refresh();
      } else {
        toast.error(result.error ?? "배너 작업에 실패했습니다.");
      }
    });
  };

  const moveBanner = (index: number, direction: -1 | 1) => {
    const current = orderedBanners[index];
    const targetIndex = index + direction;
    const target = orderedBanners[targetIndex];
    if (!current?.id || !target?.id) return;
    const currentSortOrder = current.sortOrder ?? index;
    const targetSortOrder = target.sortOrder ?? targetIndex;
    const nextCurrentSortOrder = currentSortOrder === targetSortOrder ? targetIndex : targetSortOrder;
    const nextTargetSortOrder = currentSortOrder === targetSortOrder ? index : currentSortOrder;

    runAction(
      () =>
        updateBannerOrdersAction([
          { id: current.id!, sortOrder: nextCurrentSortOrder },
          { id: target.id!, sortOrder: nextTargetSortOrder },
        ]),
      "배너 순서를 변경했습니다.",
    );
  };

  const togglePublished = (banner: AdminBannerResponse) => {
    if (!banner.id) return;
    runAction(
      () => (banner.published ? unpublishBannerAction(banner.id!) : publishBannerAction(banner.id!)),
      banner.published ? "배너를 게시중단했습니다." : "배너를 게시했습니다.",
    );
  };

  const deleteBanner = (banner: AdminBannerResponse) => {
    if (!banner.id) return;
    if (!window.confirm(`"${banner.title ?? `ID ${banner.id}`}" 배너를 제거하시겠습니까?`)) return;
    runAction(() => deleteBannerAction(banner.id!), "배너를 제거했습니다.");
  };

  return (
    <>
      <AdminHeader title="배너 관리" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/banners/new")}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
          >
            <Plus size={16} />
            배너 등록
          </button>
        </div>

        {orderedBanners.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-20 text-center">
            <p className="text-gray-500">등록된 배너가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orderedBanners.map((banner, index) => {
              const title = banner.title ?? "(제목 없음)";
              const published = banner.published ?? false;

              return (
                <article
                  key={banner.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
                >
                  <div className="relative h-40 w-full bg-gray-100">
                    <ImageWithFallback src={banner.backgroundUrl} alt={title} fill className="object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-gray-900">{title}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                          published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {published ? "게시중" : "게시중단"}
                      </span>
                    </div>
                    {banner.description ? (
                      <p className="mt-1 truncate text-sm text-gray-500">{banner.description}</p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-xs text-gray-400">ID: {banner.id}</span>
                      <span className="text-xs text-gray-400">순서: {banner.sortOrder ?? 0}</span>
                    </div>
                    {banner.link ? <p className="mt-1 truncate text-xs text-amber-600">{banner.link}</p> : null}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        aria-label={`${title} 위로`}
                        disabled={index === 0 || isPending}
                        onClick={() => moveBanner(index, -1)}
                        className="inline-flex cursor-pointer items-center justify-center gap-1 rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUp size={14} />
                        위로
                      </button>
                      <button
                        type="button"
                        aria-label={`${title} 아래로`}
                        disabled={index === orderedBanners.length - 1 || isPending}
                        onClick={() => moveBanner(index, 1)}
                        className="inline-flex cursor-pointer items-center justify-center gap-1 rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowDown size={14} />
                        아래로
                      </button>
                      <button
                        type="button"
                        aria-label={`${title} ${published ? "게시중단" : "게시"}`}
                        disabled={isPending}
                        onClick={() => togglePublished(banner)}
                        className="inline-flex cursor-pointer items-center justify-center gap-1 rounded border border-amber-200 px-2 py-1.5 text-xs text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {published ? <EyeOff size={14} /> : <Eye size={14} />}
                        {published ? "게시중단" : "게시"}
                      </button>
                      <button
                        type="button"
                        aria-label={`${title} 제거`}
                        disabled={isPending}
                        onClick={() => deleteBanner(banner)}
                        className="inline-flex cursor-pointer items-center justify-center gap-1 rounded border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                        제거
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/banners/${banner.id}`)}
                      className="mt-3 w-full cursor-pointer rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      상세
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <Pagination
            totalItems={totalElements}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            searchParams={searchParams}
            basePath="/admin/banners"
          />
        </div>
      </div>
    </>
  );
}
