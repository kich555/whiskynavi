import { FilterState } from "../../_types";
import { FilterGroup } from "./FilterGroup";

interface BrandFilterProps {
  brands: FilterState["brands"];
  selectedBrands: FilterState["brands"];
  onToggle: (brandId: string) => void;
}

export function BrandFilter({ brands, selectedBrands, onToggle }: BrandFilterProps) {
  return (
    <FilterGroup.Section title="브랜드" sectionKey="brand">
      <div className="flex flex-wrap gap-2">
        {brands.map((brand) => {
          const isSelected = selectedBrands.includes(brand);
          return (
            <button
              key={brand}
              type="button"
              onClick={() => onToggle(brand)}
              className={`rounded-full px-3 py-1.5 typo-medium-12 transition-colors ${
                isSelected ? "bg-white text-black" : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {brand}
            </button>
          );
        })}
      </div>
    </FilterGroup.Section>
  );
}
