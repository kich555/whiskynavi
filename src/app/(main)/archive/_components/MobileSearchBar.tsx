"use client";

import { Search } from "lucide-react";
import { useFilterContext } from "../_context/FilterContext";

const MobileSearchBar = () => {
  const { filters, updateKeyword } = useFilterContext();

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
    </div>
  );
};

export default MobileSearchBar;
