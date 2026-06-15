"use client";

import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ManualPurchaseBottleOption,
  type SearchManualPurchaseBottlesResult,
  searchManualPurchaseBottlesAction,
} from "../../actions";

const MAX_CACHE_SIZE = 50;

function formatStockQuantity(qty: number | null): string {
  return qty != null ? `${qty.toLocaleString("ko-KR")}병` : "-";
}

function formatPrice(price: number | null): string {
  return `${(price ?? 0).toLocaleString("ko-KR")}원`;
}

interface ManualPurchaseBottleComboboxProps {
  selected: ManualPurchaseBottleOption | null;
  onSelect: (bottle: ManualPurchaseBottleOption) => void;
}

export default function ManualPurchaseBottleCombobox({ selected, onSelect }: ManualPurchaseBottleComboboxProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ManualPurchaseBottleOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const cacheRef = useRef<Map<string, ManualPurchaseBottleOption[]>>(new Map());
  const requestIdRef = useRef(0);

  const fetchBottles = useCallback(async (keyword: string) => {
    const cached = cacheRef.current.get(keyword);
    if (cached) {
      setOptions(cached);
      setError(null);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result: SearchManualPurchaseBottlesResult = await searchManualPurchaseBottlesAction(keyword);
      if (currentRequestId !== requestIdRef.current) return;

      if (!result.success) {
        setError(result.error);
        return;
      }
      if (cacheRef.current.size >= MAX_CACHE_SIZE) {
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey !== undefined) cacheRef.current.delete(firstKey);
      }
      cacheRef.current.set(keyword, result.data);
      setOptions(result.data);
    } catch {
      if (currentRequestId !== requestIdRef.current) return;
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (open && options.length === 0 && !search) {
      fetchBottles("");
    }
  }, [fetchBottles, open, options.length, search]);

  useEffect(() => {
    if (!open) return;
    const cached = cacheRef.current.get(search);
    if (cached) {
      setOptions(cached);
      setError(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchBottles(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchBottles, open, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const visibleOptions = selected && !options.some((o) => o.id === selected.id) ? [selected, ...options] : options;
  const displayValue = selected ? `${selected.name} (ID: ${selected.id})` : "";

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={open ? search : displayValue}
        placeholder="보틀명을 검색하세요"
        className={cn(
          "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none",
          !open && !selected && "text-gray-400",
        )}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => {
          setOpen(true);
          setSearch("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />

      {selected && !open && (
        <p className="mt-1.5 text-xs text-gray-500">
          소비자가 <span className="font-medium text-gray-700">{formatPrice(selected.consumerPrice)}</span>
          <span className="mx-1">·</span>
          재고 <span className="font-medium text-gray-700">{formatStockQuantity(selected.stockQuantity)}</span>
        </p>
      )}

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <Command shouldFilter={false}>
            <CommandList>
              {loading ? (
                <div className="py-4 text-center text-sm text-gray-400">검색 중...</div>
              ) : error ? (
                <div className="py-4 text-center text-sm text-red-500">{error}</div>
              ) : (
                <>
                  <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                  <CommandGroup>
                    {visibleOptions.map((bottle) => (
                      <CommandItem
                        key={bottle.id}
                        value={String(bottle.id)}
                        onSelect={() => {
                          onSelect(bottle);
                          setOpen(false);
                          setSearch("");
                        }}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {bottle.name} (ID: {bottle.id})
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-gray-400">{formatPrice(bottle.consumerPrice)}</span>
                          <Check className={cn("h-4 w-4", selected?.id === bottle.id ? "opacity-100" : "opacity-0")} />
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
