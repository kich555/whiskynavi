"use client";

import type { AdminBannerResponse } from "@/apis/generated/api";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";

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

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 12;

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

        {banners.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-20 text-center">
            <p className="text-gray-500">등록된 배너가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => router.push(`/admin/banners/${banner.id}`)}
                className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition-shadow hover:shadow-md"
              >
                <div className="relative h-40 w-full bg-gray-100">
                  <ImageWithFallback
                    src={banner.backgroundUrl ?? ""}
                    alt={banner.title ?? "배너 배경"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{banner.title ?? "(제목 없음)"}</h3>
                  {banner.description ? (
                    <p className="mt-1 truncate text-sm text-gray-500">{banner.description}</p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">ID: {banner.id}</span>
                    {banner.link ? <span className="truncate text-xs text-amber-600">{banner.link}</span> : null}
                  </div>
                </div>
              </button>
            ))}
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
