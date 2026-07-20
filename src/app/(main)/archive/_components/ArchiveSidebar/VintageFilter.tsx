import { FILTER_DEFAULTS, FilterState } from "../../_types";
import { FilterGroup } from "./FilterGroup";
import { NumericRangeInput } from "./NumericRangeInput";

interface VintageFilterProps {
  value: FilterState["vintage"];
  onChange: (value: FilterState["vintage"]) => void;
}

const inputClassName =
  "typo-medium-12 h-8 w-full border-white/10 bg-white/5 text-center text-white focus-visible:border-white/20 focus-visible:ring-0";

export function VintageFilter({ value, onChange }: VintageFilterProps) {
  return (
    <FilterGroup.Section title="빈티지" sectionKey="vintage">
      <div className="flex items-center gap-2">
        <NumericRangeInput
          value={value[0]}
          min={FILTER_DEFAULTS.VINTAGE_MIN}
          max={value[1]}
          onChange={(v) => onChange([v, value[1]])}
          className={inputClassName}
        />
        <span className="typo-medium-12 shrink-0 text-white/40">~</span>
        <NumericRangeInput
          value={value[1]}
          min={value[0]}
          max={FILTER_DEFAULTS.VINTAGE_MAX}
          onChange={(v) => onChange([value[0], v])}
          className={inputClassName}
        />
      </div>
    </FilterGroup.Section>
  );
}
