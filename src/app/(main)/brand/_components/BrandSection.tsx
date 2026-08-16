"use client";

import type { BottleResponse, BottleSeriesResponse } from "@/apis/generated/api";
import type { Brand } from "@/types/brand";
import { useState } from "react";
import BrandBackground from "./BrandBackground";
import BrandSectionShell from "./BrandSectionShell";
import BrandTitle from "./BrandTitle";
import SeriesDropDown from "./SeriesDropDown";
import SeriesExplorer from "./SeriesExplorer";

interface BrandSectionProps {
  brand: Brand;
  series: BottleSeriesResponse[];
  seriesProducts: Record<string, BottleResponse[]>;
}

const BrandSection = ({ brand, series, seriesProducts }: BrandSectionProps) => {
  const [selected, setSelected] = useState(series[0]?.name ?? "");
  // 선택된 시리즈의 대표 이미지. 없으면 브랜드 기본 이미지 사용
  const selectedSeries = series.find((s) => s.name === selected);
  const bgImage = selectedSeries?.imgUrl ?? brand.bgImage;

  return (
    <>
      <BrandSectionShell brandId={brand.id}>
        <BrandBackground bgImage={bgImage} name={selected} />
        <div className="relative">
          <BrandTitle title={brand.name} subtitle={brand.subname} />
          <div className="mx-auto mb-8 flex max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="typo-medium-14 leading-relaxed text-white/90 sm:text-base">{brand.description}</p>
            <SeriesDropDown series={series} selected={selected} onSelect={setSelected} />
          </div>
          {/* Series Explorer */}
          {Object.keys(seriesProducts).length > 0 && (
            <SeriesExplorer brand={brand} seriesProducts={seriesProducts} selected={selected} />
          )}
        </div>
      </BrandSectionShell>
    </>
  );
};

export default BrandSection;
