"use client";

import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type BottleOption, type SearchBottlesResult, searchBottlesAction } from "../../actions";

const MAX_CACHE_SIZE = 50;

function formatStockQuantity(qty: number | null): string {
  return qty != null ? `${qty.toLocaleString("ko-KR")}병` : "-";
}

interface BottleSearchComboboxProps {
  defaultBottle?: { id: number; name: string };
}

export default function BottleSearchCombobox({ defaultBottle }: BottleSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<BottleOption | null>(
    defaultBottle ? { ...defaultBottle, stockQuantity: null } : null,
  );
  const [options, setOptions] = useState<BottleOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const cacheRef = useRef<Map<string, BottleOption[]>>(new Map());
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
      const result: SearchBottlesResult = await searchBottlesAction(keyword);
      // stale 응답 무시
      if (currentRequestId !== requestIdRef.current) return;

      if (!result.success) {
        setError(result.error);
        return;
      }
      // 캐시 크기 제한
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

  // 드롭다운 최초 오픈 시 빈 키워드로 초기 목록 로드
  useEffect(() => {
    if (open && options.length === 0 && !search) {
      fetchBottles("");
    }
  }, [open, options.length, search, fetchBottles]);

  // 검색어 변경 시 debounced fetch (캐시 히트 시 debounce 없이 즉시 반영)
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
  }, [search, open, fetchBottles]);

  // 외부 클릭 시 닫기
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

  // 편집 모드: 현재 선택된 제품이 검색 결과에 없으면 상단에 병합
  const visibleOptions = selected && !options.some((o) => o.id === selected.id) ? [selected, ...options] : options;

  const displayValue = selected ? `${selected.name} (ID: ${selected.id})` : "";

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name="bottleId" value={selected ? String(selected.id) : ""} />
      <input type="hidden" name="bottleName" value={selected?.name ?? ""} />

      <input
        ref={inputRef}
        type="text"
        value={open ? search : displayValue}
        placeholder="제품명을 검색하세요"
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
          재고 수량: <span className="font-medium text-gray-700">{formatStockQuantity(selected.stockQuantity)}</span>
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
                          setSelected(bottle);
                          setOpen(false);
                          setSearch("");
                        }}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {bottle.name} (ID: {bottle.id})
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{formatStockQuantity(bottle.stockQuantity)}</span>
                          <Check className={cn(selected?.id === bottle.id ? "opacity-100" : "opacity-0")} />
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
