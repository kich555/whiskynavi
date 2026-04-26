"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface UseTableFilterOptions {
  searchParams: Record<string, string | undefined>;
  basePath: string;
}

export function useTableFilter({ searchParams, basePath }: UseTableFilterOptions) {
  const router = useRouter();

  const getFilterValue = useCallback((key: string) => searchParams[key] || "all", [searchParams]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      const currentValue = params.get(key);
      if (value === "all" || value === currentValue) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.set("page", "1");
      router.push(`${basePath}?${params.toString()}`);
    },
    [searchParams, basePath, router],
  );

  return { getFilterValue, updateFilter };
}
