"use client";

import type { AdminBottleSeriesResponse, BottleResponse, BottleSeriesResponse } from "@/apis/generated/api";
import type { Brand } from "@/types/brand";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";

import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import AdminSeriesDetail from "./AdminSeriesDetail";
import SeriesDeleteModal from "./SeriesDeleteModal";

interface SeriesDetailContentProps {
  series: AdminBottleSeriesResponse;
  brand?: Brand;
  seriesList: BottleSeriesResponse[];
  seriesProducts: Record<string, BottleResponse[]>;
}

export default function SeriesDetailContent({
  series,
  brand,
  seriesList,
  seriesProducts,
}: SeriesDetailContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  return (
    <>
      <AdminHeader title="시리즈 상세" onToggleSidebar={toggle} showSearch={false} />
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/admin/series")}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            시리즈 목록으로 돌아가기
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/admin/series/${series.id}/edit`)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
            >
              <Edit2 size={16} />
              편집
            </button>
            <button
              type="button"
              onClick={() => overlay.open((props) => <SeriesDeleteModal {...props} id={series.id!} />)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              <Trash2 size={16} />
              삭제
            </button>
          </div>
        </div>

        <AdminSeriesDetail brand={brand} seriesList={seriesList} seriesProducts={seriesProducts} />
      </div>
    </>
  );
}
