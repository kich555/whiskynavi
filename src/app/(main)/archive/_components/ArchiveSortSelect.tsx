"use client";

import { GetApiV2BottlesSort } from "@/apis/generated/api";
import { useFilterContext } from "../_context/FilterContext";

const SORT_OPTIONS = [
  { value: GetApiV2BottlesSort.REGISTERED, label: "등록순" },
  { value: GetApiV2BottlesSort.BOTTLED_DATE, label: "병입순" },
  { value: GetApiV2BottlesSort.DISTILLATION_DATE, label: "증류일순" },
  { value: GetApiV2BottlesSort.MATURATION_AGE, label: "숙성년수순" },
] as const;

export default function ArchiveSortSelect() {
  const { filters, updateSort } = useFilterContext();

  return (
    <div className="mb-4 flex justify-end">
      <label className="flex items-center gap-2 text-white/60">
        <span className="typo-medium-12">정렬</span>
        <select
          aria-label="아카이브 정렬"
          value={filters.sort}
          onChange={(event) => updateSort(event.target.value as GetApiV2BottlesSort)}
          className="typo-medium-14 min-w-32 rounded-md border border-white/15 bg-[#252d33] px-3 py-2 text-white outline-none focus:border-white/40"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
