import { FilterState } from "../../_types";
import { FilterGroup } from "./FilterGroup";

interface SeriesFilterProps {
  series: FilterState["series"];
  selectedSeries: FilterState["series"];
  onToggle: (seriesId: string) => void;
}

export function SeriesFilter({ series, selectedSeries, onToggle }: SeriesFilterProps) {
  return (
    <FilterGroup.Section title="시리즈" sectionKey="series">
      <div className="flex flex-wrap gap-2">
        {series.map((item) => {
          const isSelected = selectedSeries.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={`typo-medium-12 rounded-full px-3 py-1.5 transition-colors ${
                isSelected ? "bg-white text-black" : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </FilterGroup.Section>
  );
}
