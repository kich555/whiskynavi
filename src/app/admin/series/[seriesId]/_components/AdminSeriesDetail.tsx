"use client";

import type { BottleResponse, BottleSeriesResponse } from "@/apis/generated/api";
import BrandSection from "@/app/(main)/brand/_components/BrandSection";
import { BrandScrollProvider } from "@/app/(main)/brand/_context/BrandScrollContext";
import type { Brand } from "@/types/brand";

interface AdminSeriesDetailProps {
  brand?: Brand;
  seriesList: BottleSeriesResponse[];
  seriesProducts: Record<string, BottleResponse[]>;
}

export default function AdminSeriesDetail({ brand, seriesList, seriesProducts }: AdminSeriesDetailProps) {
  if (!brand) {
    return <div className="rounded-lg bg-white p-4 text-gray-500">알 수 없는 브랜드의 시리즈입니다.</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg">
      <div className="relative bg-[#1d2429]">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="typo-bold-14 tracking-widest text-white/40 uppercase">프리뷰</h2>
          <p className="typo-medium-14 mt-1 text-white/70">사용자 브랜드 페이지에서 보여지는 모습입니다.</p>
        </div>
        <BrandScrollProvider>
          <BrandSection brand={brand} series={seriesList} seriesProducts={seriesProducts} />
        </BrandScrollProvider>
      </div>
    </div>
  );
}
