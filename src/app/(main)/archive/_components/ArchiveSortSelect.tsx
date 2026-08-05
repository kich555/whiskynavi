"use client";

import { GetApiV2BottlesDirection, GetApiV2BottlesSort, type BottleSearchParameterValues } from "@/apis/generated/api";
import { Funnel } from "lucide-react";
import { useState } from "react";
import { useFilterContext } from "../_context/FilterContext";
import ArchiveFilterDrawer from "./ArchiveFilterDrawer";

const SORT_OPTIONS = [
  { value: GetApiV2BottlesSort.REGISTERED, label: "등록순" },
  { value: GetApiV2BottlesSort.BOTTLED_DATE, label: "병입순" },
  { value: GetApiV2BottlesSort.DISTILLATION_DATE, label: "증류일순" },
  { value: GetApiV2BottlesSort.MATURATION_AGE, label: "숙성년수순" },
] as const;

const DIRECTION_OPTIONS = [
  { value: GetApiV2BottlesDirection.DESC, label: "내림차순" },
  { value: GetApiV2BottlesDirection.ASC, label: "오름차순" },
] as const;

interface ArchiveSortSelectProps {
  params: BottleSearchParameterValues;
}

export default function ArchiveSortSelect({ params }: ArchiveSortSelectProps) {
  const { filters, updateSort, updateDirection } = useFilterContext();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        aria-label="필터 열기"
        onClick={() => setIsFilterOpen(true)}
        className="mr-auto cursor-pointer rounded-md border border-white/15 bg-[#252d33] px-3 py-2 text-white transition-colors outline-none hover:border-white/40 focus:border-white/40 lg:hidden"
      >
        <Funnel className="size-4" />
      </button>
      <ArchiveFilterDrawer open={isFilterOpen} onOpenChange={setIsFilterOpen} params={params} />
      <span className="typo-medium-12 text-white/60">정렬</span>
      <label>
        <select
          aria-label="아카이브 정렬 기준"
          value={filters.sort}
          onChange={(event) => updateSort(event.target.value as GetApiV2BottlesSort)}
          className="typo-medium-14 min-w-29 rounded-md border border-white/15 bg-[#252d33] px-3 py-2 text-white outline-none focus:border-white/40"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <select
          aria-label="아카이브 정렬 방향"
          value={filters.direction}
          onChange={(event) => updateDirection(event.target.value as GetApiV2BottlesDirection)}
          className="typo-medium-14 min-w-25 rounded-md border border-white/15 bg-[#252d33] px-3 py-2 text-white outline-none focus:border-white/40"
        >
          {DIRECTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
