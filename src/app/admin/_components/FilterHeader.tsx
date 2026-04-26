"use client";

import { Filter } from "lucide-react";
import { overlay } from "overlay-kit";
import { useEffect, useRef } from "react";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterHeaderProps {
  label: string;
  filterKey: string;
  options: FilterOption[];
  currentValue: string;
  onSelect: (key: string, value: string) => void;
  /** 아이콘 크기 (기본 12) */
  iconSize?: number;
  /** 드롭다운 너비 클래스 (기본 "w-36") */
  dropdownWidth?: string;
  /** th에 적용할 추가 className */
  className?: string;
}

interface DropdownProps {
  isOpen: boolean;
  close: () => void;
  rect: DOMRect;
  options: FilterOption[];
  currentValue: string;
  filterKey: string;
  onSelect: (key: string, value: string) => void;
  dropdownWidth: string;
}

function FilterDropdown({
  isOpen,
  close,
  rect,
  options,
  currentValue,
  filterKey,
  onSelect,
  dropdownWidth,
}: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      style={{ top: rect.bottom + 4, left: rect.left }}
      className={`fixed z-50 rounded-lg border border-gray-300 bg-white shadow-lg ${dropdownWidth}`}
    >
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          onClick={() => {
            onSelect(filterKey, option.value);
            close();
          }}
          className={`block w-full cursor-pointer px-3 py-2 text-left text-xs hover:bg-gray-100 ${
            currentValue === option.value ? "bg-amber-50 text-amber-700" : ""
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function FilterHeader({
  label,
  filterKey,
  options,
  currentValue,
  onSelect,
  iconSize = 12,
  dropdownWidth = "w-36",
  className = "typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase",
}: FilterHeaderProps) {
  const isActive = currentValue !== "all";
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    overlay.open(({ isOpen, close }) => (
      <FilterDropdown
        isOpen={isOpen}
        close={close}
        rect={rect}
        options={options}
        currentValue={currentValue}
        filterKey={filterKey}
        onSelect={onSelect}
        dropdownWidth={dropdownWidth}
      />
    ));
  };

  return (
    <th className={className}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`flex cursor-pointer items-center gap-1 hover:text-amber-600 ${isActive ? "text-amber-600" : ""}`}
      >
        {label}
        <Filter size={iconSize} className={isActive ? "fill-amber-600" : ""} />
      </button>
    </th>
  );
}
