"use client";

import type { AdminBannerResponse } from "@/apis/generated/api";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";
import { deleteBannerAction, publishBannerAction, unpublishBannerAction, updateBannerOrdersAction } from "../actions";

interface BannersContentProps {
  searchParams: {
    publishedPage?: string;
    publishedLimit?: string;
    unpublishedPage?: string;
    unpublishedLimit?: string;
  };
  publishedBanners: AdminBannerResponse[];
  publishedTotalElements: number;
  publishedPage: number;
  publishedLimit: number;
  unpublishedBanners: AdminBannerResponse[];
  unpublishedTotalElements: number;
  unpublishedPage: number;
  unpublishedLimit: number;
}

interface BannerListSectionProps {
  id: string;
  title: string;
  description: string;
  count: number;
  itemCount: number;
  emptyMessage: string;
  published: boolean;
  children: ReactNode;
  pagination: ReactNode;
}

function BannerListSection({
  id,
  title,
  description,
  count,
  itemCount,
  emptyMessage,
  published,
  children,
  pagination,
}: BannerListSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className={`rounded-xl border p-4 md:p-6 ${
        published ? "border-amber-200 bg-amber-50/40" : "border-gray-200 bg-gray-50/70"
      }`}
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 id={id} className="typo-bold-20 text-gray-900">
              {title}
            </h2>
            <span
              className={`typo-bold-12 rounded-full px-2.5 py-1 ${
                published ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-700"
              }`}
            >
              {count}개
            </span>
          </div>
          <p className="typo-medium-14 mt-2 text-gray-500">{description}</p>
        </div>
      </div>

      {itemCount === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-12 text-center">
          <p className="typo-medium-14 text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div>
      )}
      {pagination}
    </section>
  );
}

export default function BannersContent({
  searchParams,
  publishedBanners,
  publishedTotalElements,
  publishedPage,
  publishedLimit,
  unpublishedBanners,
  unpublishedTotalElements,
  unpublishedPage,
  unpublishedLimit,
}: BannersContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const orderedPublishedBanners = useMemo(
    () => [...publishedBanners].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.id ?? 0) - (b.id ?? 0)),
    [publishedBanners],
  );
  const publishedIndexById = useMemo(
    () => new Map(orderedPublishedBanners.map((banner, index) => [banner.id, index])),
    [orderedPublishedBanners],
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

  const moveBanner = (banner: AdminBannerResponse, direction: -1 | 1) => {
    const currentIndex = publishedIndexById.get(banner.id);
    if (currentIndex === undefined) return;

    const targetIndex = currentIndex + direction;
    const target = orderedPublishedBanners[targetIndex];
    const current = orderedPublishedBanners[currentIndex];
    if (!current?.id || !target?.id) return;
    const currentId = current.id;
    const targetId = target.id;

    const pageOffset = (publishedPage - 1) * publishedLimit;
    const currentSortOrder = pageOffset + currentIndex + 1;
    const targetSortOrder = pageOffset + targetIndex + 1;

    runAction(
      () =>
        updateBannerOrdersAction([
          { id: currentId, sortOrder: targetSortOrder },
          { id: targetId, sortOrder: currentSortOrder },
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

  const renderBannerCard = (banner: AdminBannerResponse) => {
    const title = banner.title ?? "(제목 없음)";
    const published = banner.published ?? false;
    const publishedIndex = publishedIndexById.get(banner.id);
    const displayedSortOrder =
      published && publishedIndex !== undefined ? (publishedPage - 1) * publishedLimit + publishedIndex + 1 : null;

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
              className={`typo-bold-12 shrink-0 rounded-full px-2 py-1 ${
                published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {published ? "게시중" : "게시중단"}
            </span>
          </div>
          {banner.description ? (
            <p className="typo-medium-14 mt-1 truncate text-gray-500">{banner.description}</p>
          ) : null}
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="typo-medium-12 text-gray-400">ID: {banner.id}</span>
            <span className="typo-medium-12 text-gray-400">순서: {displayedSortOrder ?? "-"}</span>
          </div>
          {banner.link ? <p className="typo-medium-12 mt-1 truncate text-amber-600">{banner.link}</p> : null}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-label={`${title} 위로`}
              disabled={!published || publishedIndex === undefined || publishedIndex === 0 || isPending}
              onClick={() => moveBanner(banner, -1)}
              className="typo-medium-12 inline-flex cursor-pointer items-center justify-center gap-1 rounded border border-gray-300 px-2 py-1.5 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp size={14} />
              위로
            </button>
            <button
              type="button"
              aria-label={`${title} 아래로`}
              disabled={
                !published ||
                publishedIndex === undefined ||
                publishedIndex === orderedPublishedBanners.length - 1 ||
                isPending
              }
              onClick={() => moveBanner(banner, 1)}
              className="typo-medium-12 inline-flex cursor-pointer items-center justify-center gap-1 rounded border border-gray-300 px-2 py-1.5 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowDown size={14} />
              아래로
            </button>
            <button
              type="button"
              aria-label={`${title} ${published ? "게시중단" : "게시"}`}
              disabled={isPending}
              onClick={() => togglePublished(banner)}
              className="typo-medium-12 inline-flex cursor-pointer items-center justify-center gap-1 rounded border border-amber-200 px-2 py-1.5 text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {published ? <EyeOff size={14} /> : <Eye size={14} />}
              {published ? "게시중단" : "게시"}
            </button>
            <button
              type="button"
              aria-label={`${title} 제거`}
              disabled={isPending}
              onClick={() => deleteBanner(banner)}
              className="typo-medium-12 inline-flex cursor-pointer items-center justify-center gap-1 rounded border border-red-200 px-2 py-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} />
              제거
            </button>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/admin/banners/${banner.id}`)}
            className="typo-bold-14 mt-3 w-full cursor-pointer rounded bg-gray-900 px-3 py-2 text-white hover:bg-gray-800"
          >
            상세
          </button>
        </div>
      </article>
    );
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

        <div className="space-y-10">
          <BannerListSection
            id="published-banners-heading"
            title="게시 중인 배너"
            description="사용자 화면에 노출되는 배너입니다. 이 구역에서 노출 순서를 변경할 수 있습니다."
            count={publishedTotalElements}
            itemCount={orderedPublishedBanners.length}
            emptyMessage="현재 게시 중인 배너가 없습니다."
            published
            pagination={
              publishedTotalElements > publishedLimit ? (
                <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <Pagination
                    totalItems={publishedTotalElements}
                    itemsPerPage={publishedLimit}
                    currentPage={publishedPage}
                    searchParams={searchParams}
                    basePath="/admin/banners"
                    pageParam="publishedPage"
                    limitParam="publishedLimit"
                  />
                </div>
              ) : null
            }
          >
            {orderedPublishedBanners.map(renderBannerCard)}
          </BannerListSection>

          <BannerListSection
            id="unpublished-banners-heading"
            title="게시 중단된 배너"
            description="현재 사용자 화면에 노출되지 않는 배너입니다."
            count={unpublishedTotalElements}
            itemCount={unpublishedBanners.length}
            emptyMessage="게시 중단된 배너가 없습니다."
            published={false}
            pagination={
              unpublishedTotalElements > unpublishedLimit ? (
                <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <Pagination
                    totalItems={unpublishedTotalElements}
                    itemsPerPage={unpublishedLimit}
                    currentPage={unpublishedPage}
                    searchParams={searchParams}
                    basePath="/admin/banners"
                    pageParam="unpublishedPage"
                    limitParam="unpublishedLimit"
                  />
                </div>
              ) : null
            }
          >
            {unpublishedBanners.map(renderBannerCard)}
          </BannerListSection>
        </div>
      </div>
    </>
  );
}
