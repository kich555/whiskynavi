"use client";

import type { BottleResponse, BottleSeriesResponse } from "@/apis/generated/api";
import type { Brand } from "@/types/brand";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProductCarousel from "./ProductCarousel";

interface SeriesExplorerProps {
  brand: Brand;
  series: BottleSeriesResponse[];
  seriesProducts: Record<string, BottleResponse[]>;
  selected: string;
  onSelect: (name: string) => void;
}

const SeriesExplorer = ({ brand, series, seriesProducts, selected, onSelect }: SeriesExplorerProps) => {
  const seriesNames = series.map((s) => s.name).filter((n): n is string => Boolean(n));
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const products = seriesProducts[selected] ?? [];

  // 외부 클릭 / ESC 로 dropdown 닫기
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      {/* Series panel: header row (title + select) + carousel */}
      <div className="border border-white/15 bg-white/[0.03]">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 lg:px-8 lg:py-6">
          <div className="min-w-0">
            <span className="typo-bold-12 text-white/50">SERIES</span>
            <h3 className="typo-bold-20 mt-1 truncate text-white lg:text-2xl">{selected}</h3>
          </div>

          {/* Series select */}
          <div ref={rootRef} className="relative shrink-0">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label="시리즈 선택"
              onClick={() => setOpen((v) => !v)}
              className="typo-medium-14 flex min-h-11 cursor-pointer items-center gap-2 border border-white/30 bg-white/10 px-4 text-white transition-colors hover:bg-white/15"
            >
              시리즈
              <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <ul
                role="listbox"
                aria-label="시리즈 선택"
                className="absolute top-full right-0 z-50 mt-1 max-h-60 w-56 overflow-y-auto border border-white/20 bg-[#222a31] shadow-lg"
              >
                {seriesNames.map((name) => {
                  const active = name === selected;
                  return (
                    <li key={name} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(name);
                          setOpen(false);
                        }}
                        className={`typo-medium-14 flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 px-4 text-left transition-colors ${
                          active ? "bg-white text-[#1d2429]" : "text-white/85 hover:bg-white/15 hover:text-white"
                        }`}
                      >
                        {name}
                        {active && <ArrowRight size={14} className="shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Selected series carousel */}
        {products.length > 0 && (
          <div className="px-3 py-6 lg:px-6 lg:py-8">
            {/* key remount resets Carousel3D index when switching series */}
            <ProductCarousel key={selected} brandProducts={products} brand={brand} />
          </div>
        )}

        {/* Archive Link for selected series */}
        {selected && (
          <div className="border-t border-white/10 px-5 py-5 text-center lg:py-6">
            <Link
              href={`/archive?brand=${encodeURIComponent(brand.id)}&series=${encodeURIComponent(selected)}`}
              className="typo-medium-14 inline-flex min-h-11 items-center justify-center gap-2 border border-white px-6 text-white transition-all hover:bg-white hover:text-[#1d2429] sm:px-7 sm:text-base"
            >
              {selected} 제품 보러가기
              <ArrowRight size={16} className="shrink-0" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesExplorer;