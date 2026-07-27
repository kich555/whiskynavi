"use client";

import type { BottleSearchParameterValues } from "@/apis/generated/api";
import type { ReactNode } from "react";
import { FilterContext } from "../_context/FilterContext";
import { useFilters } from "../_hooks/useFilters";
import { ArchiveSidebar } from "./ArchiveSidebar";
import ArchiveSortSelect from "./ArchiveSortSelect";
import BottleListSkeleton from "./BottleListSkeleton";
import MobileSearchBar from "./MobileSearchBar";

interface ArchiveClientShellProps {
  bottleParams: BottleSearchParameterValues;
  children: ReactNode;
}

export default function ArchiveClientShell({ bottleParams, children }: ArchiveClientShellProps) {
  const filterState = useFilters();

  return (
    <FilterContext.Provider value={filterState}>
      <MobileSearchBar series={bottleParams.series ?? []} />
      <div className="mx-auto flex max-w-[1440px] px-4 pt-4 pb-12 lg:px-10 lg:pt-2">
        <ArchiveSidebar params={bottleParams} />
        <main className="flex min-h-[calc(100vh-14rem)] flex-1 flex-col">
          <ArchiveSortSelect />
          {filterState.isPending ? <BottleListSkeleton /> : children}
        </main>
      </div>
    </FilterContext.Provider>
  );
}
