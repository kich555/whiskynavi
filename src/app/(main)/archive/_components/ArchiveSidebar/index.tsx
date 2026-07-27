"use client";

import { BottleSearchParameterValues } from "@/apis/generated/api";
import { IconSearch } from "@/icons";
import { useCallback } from "react";
import { useFilterContext } from "../../_context/FilterContext";
import { INITIAL_FILTER_STATE } from "../../_types";
import { AbvFilter } from "./AbvFilter";
import CurrentFilters from "./ActiveFilters";
import { BrandFilter } from "./BrandFilter";
import { CaskTypeFilter } from "./CaskTypeFilter";
import { DistilleryFilter } from "./DistilleryFilter";
import { FilterGroup } from "./FilterGroup";
import { MaltTypeFilter } from "./MaltTypeFilter";
import { SeriesFilter } from "./SeriesFilter";
import { VintageFilter } from "./VintageFilter";

interface ArchiveSidebarProps {
  params: BottleSearchParameterValues;
}

const DEFAULT_EXPANDED = ["brand", "series", "malt", "distillery", "cask", "abv", "vintage"];

export function ArchiveSidebar({ params }: ArchiveSidebarProps) {
  const {
    filters,
    setFilters,
    toggleBrand,
    toggleSeries,
    toggleMaltType,
    removeActiveFilter,
    updateKeyword,
    updateDistilleries,
    updateCaskTypes,
    updateAbv,
    updateVintage,
  } = useFilterContext();

  const clearAllFilters = useCallback(() => {
    setFilters((current) => ({
      ...INITIAL_FILTER_STATE,
      sort: current.sort,
      direction: current.direction,
    }));
  }, [setFilters]);

  return (
    <aside className="hidden w-80 shrink-0 lg:mr-8 lg:block">
      <div className="border border-white/10 bg-white/5 p-6">
        <div className="mb-6">
          <h3 className="typo-bold-18 mb-3 text-white">보틀 검색</h3>
          <div className="bg-popover flex h-9 items-center gap-2 rounded-md border border-white/20 px-3">
            <IconSearch className="size-4 shrink-0" />
            <input
              placeholder="보틀 이름, 시리즈명으로 검색하기"
              value={filters.keyword}
              onChange={(e) => updateKeyword(e.target.value)}
              className="text-popover-foreground typo-medium-14 flex h-full w-full bg-transparent outline-hidden placeholder:text-[#4C4C4C]"
            />
          </div>
        </div>

        <CurrentFilters filters={filters} onRemove={removeActiveFilter} onClearAll={clearAllFilters} />

        <FilterGroup defaultExpanded={DEFAULT_EXPANDED}>
          <BrandFilter brands={params.brands ?? []} selectedBrands={filters.brands} onToggle={toggleBrand} />

          <SeriesFilter series={params.series ?? []} selectedSeries={filters.series} onToggle={toggleSeries} />

          <MaltTypeFilter
            maltTypes={params.maltTypes ?? []}
            selectedMaltTypes={filters.maltTypes}
            onToggle={toggleMaltType}
          />

          <DistilleryFilter
            distilleries={params.distilleries ?? []}
            selectedDistilleries={filters.distilleries}
            onChange={updateDistilleries}
          />

          <CaskTypeFilter
            caskTypes={params.caskTypes ?? []}
            selectedCaskTypes={filters.caskTypes}
            onChange={updateCaskTypes}
          />

          <AbvFilter value={filters.abv} onChange={updateAbv} />

          <VintageFilter value={filters.vintage} onChange={updateVintage} />
        </FilterGroup>
      </div>
    </aside>
  );
}
