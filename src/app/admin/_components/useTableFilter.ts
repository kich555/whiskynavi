"use client";

import { createSearchParams, type AdminSearchParams } from "@/app/admin/_lib/searchParams";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface UseTableFilterOptions {
  searchParams: AdminSearchParams;
  basePath: string;
}

export function useTableFilter({ searchParams, basePath }: UseTableFilterOptions) {
  const router = useRouter();

  const getFilterValue = useCallback(
    (key: string) => {
      const value = searchParams[key];
      return typeof value === "string" ? value : "all";
    },
    [searchParams],
  );

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = createSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "all") params.delete(key);
        else params.set(key, value);
      });
      params.set("page", "1");
      router.push(`${basePath}?${params.toString()}`);
    },
    [searchParams, basePath, router],
  );

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const currentValue = getFilterValue(key);
      updateFilters({ [key]: value === currentValue ? undefined : value });
    },
    [getFilterValue, updateFilters],
  );

  return { getFilterValue, updateFilter, updateFilters };
}
