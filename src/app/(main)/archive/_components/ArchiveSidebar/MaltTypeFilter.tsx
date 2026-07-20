import { Checkbox } from "@/components/ui/checkbox";
import { FilterState } from "../../_types";
import { FilterGroup } from "./FilterGroup";

interface MaltTypeFilterProps {
  maltTypes: FilterState["maltTypes"];
  selectedMaltTypes: FilterState["maltTypes"];
  onToggle: (maltId: string) => void;
}

export function MaltTypeFilter({ maltTypes, selectedMaltTypes, onToggle }: MaltTypeFilterProps) {
  return (
    <FilterGroup.Section title="몰트" sectionKey="malt">
      <div className="space-y-2.5">
        {maltTypes.map((malt) => (
          <div key={malt} className="group flex items-center gap-2">
            <Checkbox
              id={`malt-${malt}`}
              checked={selectedMaltTypes.includes(malt)}
              onCheckedChange={() => onToggle(malt)}
              className="border-white/30 bg-white/10 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
            />
            <label
              htmlFor={`malt-${malt}`}
              className="typo-medium-14 cursor-pointer text-white/80 group-hover:text-white"
            >
              {malt}
            </label>
          </div>
        ))}
      </div>
    </FilterGroup.Section>
  );
}
