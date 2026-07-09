"use client";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

interface ParameterComboboxProps {
  name: string;
  options?: string[];
  maxLength?: number;
  required?: boolean;
  defaultValue?: string | number;
}

export default function ParameterCombobox({
  name,
  options,
  maxLength,
  required,
  defaultValue,
}: ParameterComboboxProps) {
  const initValue = defaultValue == null ? "" : String(defaultValue);
  const [committedValue, setCommittedValue] = useState(initValue);
  const [inputValue, setInputValue] = useState(initValue);
  const [isOpen, setIsOpen] = useState(false);

  const uniqueOptions = useMemo(
    () => Array.from(new Set((options ?? []).filter(Boolean))),
    [options],
  );

  const filteredOptions = useMemo(() => {
    const keyword = inputValue.trim().toLowerCase();
    if (!keyword) return uniqueOptions;
    return uniqueOptions.filter((o) => o.toLowerCase().includes(keyword));
  }, [inputValue, uniqueOptions]);

  if (uniqueOptions.length === 0) {
    return (
      <input
        type="text"
        name={name}
        maxLength={maxLength}
        required={required}
        defaultValue={defaultValue}
        className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
      />
    );
  }

  return (
    <div
      className="relative flex-1"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setInputValue(committedValue);
          setIsOpen(false);
        }
      }}
    >
      <input type="hidden" name={name} value={committedValue} />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          const nextValue = e.target.value;
          setInputValue(nextValue);
          setCommittedValue(nextValue);
          setIsOpen(true);
        }}
        onFocus={() => {
          setInputValue("");
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsOpen(false);
          if (e.key === "ArrowDown") setIsOpen(true);
        }}
        maxLength={maxLength}
        required={required}
        className="w-full rounded border border-gray-300 py-1 pr-8 pl-2 text-sm"
      />
      <button
        type="button"
        aria-label="선택지 열기"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen((prev) => !prev)}
        className="absolute top-1/2 right-1 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <ChevronDown size={16} />
      </button>
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded border border-gray-200 bg-white py-1 text-sm shadow-lg"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === committedValue}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setCommittedValue(option);
                  setInputValue(option);
                  setIsOpen(false);
                }}
                className="block w-full cursor-pointer px-2 py-1.5 text-left text-gray-700 hover:bg-amber-50 hover:text-amber-700"
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-2 py-1.5 text-gray-400">일치하는 선택지가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}
