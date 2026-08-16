"use client";

import { BottleSeriesResponse } from "@/apis/generated/api";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SeriesDropDownProps {
  series: BottleSeriesResponse[];
  selected: string;
  onSelect: (name: string) => void;
}

const SeriesDropDown = ({ series, selected, onSelect }: SeriesDropDownProps) => {
  const { open, setOpen, rootRef } = useDropdown();

  const seriesNames = series.map((s) => s.name).filter((n): n is string => Boolean(n));
  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="시리즈 선택"
        onClick={() => setOpen((v) => !v)}
        className="typo-medium-14 flex min-h-11 cursor-pointer items-center justify-between gap-2 border border-white/30 bg-white/10 px-4 text-white transition-colors hover:bg-white/15"
      >
        <div className="min-w-48">{selected}</div>
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
  );
};

export default SeriesDropDown;

const useDropdown = () => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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

  return { open, setOpen, rootRef };
};
