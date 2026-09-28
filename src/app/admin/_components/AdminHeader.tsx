"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, Search } from "lucide-react";
import { useState, useTransition } from "react";

interface AdminHeaderProps {
  title: string;
  onToggleSidebar: () => void;
  showSearch?: boolean;
  searchQuery?: string;
  onSearch?: (value: string) => void;
  searchField?: string;
  searchFieldOptions?: Array<{ value: string; label: string }>;
  onSearchFieldChange?: (value: string) => void;
}

function getSearchPlaceholder(label: string) {
  const lastChar = label.charCodeAt(label.length - 1);
  const hasHangulSyllable = lastChar >= 0xac00 && lastChar <= 0xd7a3;

  if (!hasHangulSyllable) {
    return `${label}로 검색...`;
  }

  const jongseongIndex = (lastChar - 0xac00) % 28;
  const endsWithRieul = jongseongIndex === 8;
  const particle = jongseongIndex === 0 || endsWithRieul ? "로" : "으로";

  return `${label}${particle} 검색...`;
}

export default function AdminHeader({
  title,
  onToggleSidebar,
  showSearch = true,
  searchQuery = "",
  onSearch,
  searchField,
  searchFieldOptions,
  onSearchFieldChange,
}: AdminHeaderProps) {
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchQuery);
  const [internalSearchField, setInternalSearchField] = useState(searchFieldOptions?.[0]?.value ?? "");
  const isSearchFieldControlled = searchField !== undefined;
  const hasInternalSearchFieldOption =
    searchFieldOptions?.some((option) => option.value === internalSearchField) ?? false;
  const resolvedSearchField = isSearchFieldControlled
    ? searchField
    : hasInternalSearchFieldOption
      ? internalSearchField
      : (searchFieldOptions?.[0]?.value ?? "");
  const selectedSearchField = searchFieldOptions?.find((option) => option.value === resolvedSearchField);
  const searchPlaceholder = selectedSearchField ? getSearchPlaceholder(selectedSearchField.label) : "이름으로 검색...";

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (onSearch) {
      startTransition(() => {
        onSearch(value);
      });
    }
  };

  const handleSearchFieldChange = (value: string) => {
    if (!isSearchFieldControlled) {
      setInternalSearchField(value);
    }

    onSearchFieldChange?.(value);
  };

  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="px-4 py-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="관리자 메뉴 열기/닫기"
              className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <Menu size={24} className="text-gray-600" />
            </button>
            <h2 className="typo-bold-24 leading-snug text-gray-900">{title}</h2>
          </div>
        </div>

        {showSearch && (
          <div className="flex items-stretch gap-4">
            {searchFieldOptions && searchFieldOptions.length > 0 && (
              <div className="flex self-stretch">
                <Select value={resolvedSearchField} onValueChange={handleSearchFieldChange}>
                  <SelectTrigger
                    aria-label="검색 필드"
                    className="h-full min-w-32 self-stretch rounded-lg border-gray-300 bg-white data-[size=default]:h-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {searchFieldOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 -translate-y-1/2 transform text-gray-400" size={20} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-12 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              {isPending && (
                <div className="absolute top-1/2 right-4 -translate-y-1/2 transform">
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-amber-600"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
