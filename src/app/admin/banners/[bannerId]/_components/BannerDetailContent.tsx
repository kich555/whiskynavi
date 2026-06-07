"use client";

import type { AdminBannerResponse } from "@/apis/generated/api";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { ArrowLeft, Edit2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";

interface BannerDetailContentProps {
  banner: AdminBannerResponse;
}

export default function BannerDetailContent({ banner }: BannerDetailContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  return (
    <>
      <AdminHeader title="배너 상세" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            배너 목록으로 돌아가기
          </button>

          <button
            type="button"
            onClick={() => router.push(`/admin/banners/${banner.id}/edit`)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
          >
            <Edit2 size={16} />
            편집
          </button>
        </div>

        {/* 미리보기 섹션 */}
        <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
          <div className="relative h-56 w-full bg-gray-900">
            {banner.backgroundUrl ? (
              <ImageWithFallback
                src={banner.backgroundUrl}
                alt="배경 이미지"
                fill
                className="object-cover opacity-70"
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-6">
                <div className="text-white">
                  <h2 className="typo-bold-24">{banner.title ?? "(제목 없음)"}</h2>
                  {banner.description ? <p className="mt-1 text-white/80">{banner.description}</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메타데이터 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="typo-bold-18 mb-4 text-gray-900">배너 정보</h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="typo-medium-14 text-gray-500">ID</dt>
              <dd className="mt-1 text-gray-900">{banner.id}</dd>
            </div>
            <div>
              <dt className="typo-medium-14 text-gray-500">제목</dt>
              <dd className="mt-1 text-gray-900">{banner.title ?? "(없음)"}</dd>
            </div>
            <div>
              <dt className="typo-medium-14 text-gray-500">게시 상태</dt>
              <dd className="mt-1 text-gray-900">{banner.published ? "게시중" : "게시중단"}</dd>
            </div>
            <div>
              <dt className="typo-medium-14 text-gray-500">노출 순서</dt>
              <dd className="mt-1 text-gray-900">{banner.sortOrder ?? 0}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="typo-medium-14 text-gray-500">설명</dt>
              <dd className="mt-1 text-gray-900">{banner.description ?? "(없음)"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="typo-medium-14 text-gray-500">링크</dt>
              <dd className="mt-1">
                {banner.link ? (
                  <a
                    href={banner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700"
                  >
                    {banner.link}
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-gray-900">(없음)</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
