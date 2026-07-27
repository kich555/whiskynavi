"use client";

import { Search } from "lucide-react";
import { useFilterContext } from "../_context/FilterContext";

interface MobileSearchBarProps {
  series: string[];
}

const MobileSearchBar = ({ series }: MobileSearchBarProps) => {
  const { filters, toggleSeries, updateKeyword } = useFilterContext();

  return (
    <div className="mx-auto -mt-8 max-w-[1440px] px-4 py-4 lg:hidden">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400" size={16} />
        <input
          type="text"
          placeholder="보틀명, 증류소로 검색하세요"
          value={filters.keyword}
          onChange={(e) => updateKeyword(e.target.value)}
          className="typo-medium-14 w-full border border-white/10 bg-white/5 py-3 pr-3 pl-10 text-white placeholder-gray-400 transition-all focus:border-white/30 focus:outline-none"
        />
      </div>
      {series.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="시리즈 필터">
          {series.map((item) => {
            const isSelected = filters.series.includes(item);
            return (
              <button
                key={item}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleSeries(item)}
                className={`typo-medium-12 shrink-0 rounded-full px-3 py-2 transition-colors ${
                  isSelected ? "bg-white text-black" : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default MobileSearchBar;
