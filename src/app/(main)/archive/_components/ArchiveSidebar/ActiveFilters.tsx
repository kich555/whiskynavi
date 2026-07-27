"use client";

import { X } from "lucide-react";
import { useMemo } from "react";
import { FILTER_DEFAULTS, FilterState } from "../../_types";

interface CurrentFiltersProps {
  filters: FilterState;
  onRemove: (type: "brands" | "series" | "maltTypes" | "distilleries" | "caskTypes", value: string) => void;
  onClearAll: () => void;
}

const CurrentFilters = ({ filters, onRemove, onClearAll }: CurrentFiltersProps) => {
  const filterConfigs = [
    { key: "brands" as const, items: filters.brands },
    { key: "series" as const, items: filters.series },
    { key: "maltTypes" as const, items: filters.maltTypes },
    { key: "distilleries" as const, items: filters.distilleries },
    { key: "caskTypes" as const, items: filters.caskTypes },
  ];

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    count += filters.brands.length;
    count += filters.series.length;
    count += filters.maltTypes.length;
    count += filters.distilleries.length;
    count += filters.caskTypes.length;
    if (filters.abv[0] !== FILTER_DEFAULTS.ABV_MIN || filters.abv[1] !== FILTER_DEFAULTS.ABV_MAX) count++;
    if (filters.vintage[0] !== FILTER_DEFAULTS.VINTAGE_MIN || filters.vintage[1] !== FILTER_DEFAULTS.VINTAGE_MAX)
      count++;
    return count;
  }, [filters]);

  if (activeFiltersCount === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="typo-medium-12 text-white/60">적용된 필터 ({activeFiltersCount})</span>
        <button
          type="button"
          onClick={onClearAll}
          className="typo-medium-12 text-white/40 transition-colors hover:text-white/80"
        >
          전체 초기화
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {filterConfigs.map(({ key, items }) =>
          items.map((item) => (
            <span
              key={`${key}-${item}`}
              className="typo-medium-12 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-white/80"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(key, item)}
                className="text-white/40 transition-colors hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )),
        )}
      </div>
    </div>
  );
};

export default CurrentFilters;
