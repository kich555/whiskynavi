import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { FilterState } from "../../_types";
import { FilterGroup } from "./FilterGroup";

interface CaskTypeFilterProps {
  caskTypes: FilterState["caskTypes"];
  selectedCaskTypes: FilterState["caskTypes"];
  onChange: (values: string[]) => void;
}

export function CaskTypeFilter({ caskTypes, selectedCaskTypes, onChange }: CaskTypeFilterProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => caskTypes.filter((c) => c.toLowerCase().includes(search.toLowerCase())),
    [caskTypes, search],
  );

  const toggle = useCallback(
    (cask: string) => {
      if (selectedCaskTypes.includes(cask)) {
        onChange(selectedCaskTypes.filter((c) => c !== cask));
      } else {
        onChange([...selectedCaskTypes, cask]);
      }
    },
    [selectedCaskTypes, onChange],
  );

  return (
    <FilterGroup.Section title="캐스크 종류" sectionKey="cask">
      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
        <Input
          placeholder="캐스크 타입으로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="typo-medium-12 h-8 border-white/10 bg-white/5 pl-8 text-white placeholder:text-white/30 focus-visible:border-white/20 focus-visible:ring-0"
        />
      </div>
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {filtered.map((cask) => (
          <div key={cask} className="group flex items-center gap-2">
            <Checkbox
              id={`cask-${cask}`}
              checked={selectedCaskTypes.includes(cask)}
              onCheckedChange={() => toggle(cask)}
              className="border-white/30 bg-white/10 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
            />
            <label
              htmlFor={`cask-${cask}`}
              className="typo-medium-14 cursor-pointer text-white/80 group-hover:text-white"
            >
              {cask}
            </label>
          </div>
        ))}
        {filtered.length === 0 && <p className="typo-medium-12 py-2 text-center text-white/30">검색 결과가 없습니다</p>}
      </div>
    </FilterGroup.Section>
  );
}
