"use client";

import type { BottleAdminResponse } from "@/apis/generated/api";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import FilterHeader from "../../_components/FilterHeader";
import Pagination from "../../_components/Pagination";
import { useTableFilter } from "../../_components/useTableFilter";
import ProductsTableBody from "./ProductsTableBody";

interface ProductsContentProps {
  searchParams: {
    page?: string;
    limit?: string;
    q?: string;
    brand?: string;
    distillery?: string;
    series?: string;
    caskType?: string;
    visible?: string;
    sortBy?: string;
    sortDirection?: string;
  };
  products: BottleAdminResponse[];
  totalElements: number;
  brands: string[];
  distilleries: string[];
  series: string[];
  caskTypes: string[];
}

const SORT_OPTIONS = {
  id: [
    { value: "all", label: "기본 정렬" },
    { value: "ID,DESC", label: "ID 내림차순" },
    { value: "ID,ASC", label: "ID 오름차순" },
  ],
  name: [
    { value: "all", label: "기본 정렬" },
    { value: "NAME,ASC", label: "제품명 가나다순" },
    { value: "NAME,DESC", label: "제품명 역순" },
  ],
  abv: [
    { value: "all", label: "기본 정렬" },
    { value: "ABV,DESC", label: "도수 높은순" },
    { value: "ABV,ASC", label: "도수 낮은순" },
  ],
  capacity: [
    { value: "all", label: "기본 정렬" },
    { value: "CAPACITY,DESC", label: "용량 큰순" },
    { value: "CAPACITY,ASC", label: "용량 작은순" },
  ],
  bottledDate: [
    { value: "all", label: "기본 정렬" },
    { value: "BOTTLED_DATE,DESC", label: "병입일 최신순" },
    { value: "BOTTLED_DATE,ASC", label: "병입일 오래된순" },
  ],
} as const;

export default function ProductsContent({
  searchParams,
  products,
  totalElements,
  brands,
  distilleries,
  series,
  caskTypes,
}: ProductsContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const searchQuery = searchParams.q || "";

  const { getFilterValue, updateFilter, updateFilters } = useTableFilter({
    searchParams,
    basePath: "/admin/products",
  });

  const brandOptions = [{ value: "all", label: "전체" }, ...brands.map((b) => ({ value: b, label: b }))];

  const distilleryOptions = [{ value: "all", label: "전체" }, ...distilleries.map((d) => ({ value: d, label: d }))];

  const seriesOptions = [{ value: "all", label: "전체" }, ...series.map((value) => ({ value, label: value }))];

  const caskTypeOptions = [{ value: "all", label: "전체" }, ...caskTypes.map((value) => ({ value, label: value }))];

  const visibleOptions = [
    { value: "all", label: "전체" },
    { value: "true", label: "노출" },
    { value: "false", label: "숨김" },
  ];

  const currentSort = searchParams.sortBy ? `${searchParams.sortBy},${searchParams.sortDirection ?? "DESC"}` : "all";

  const handleSort = (_key: string, value: string) => {
    if (value === "all") {
      updateFilters({ sortBy: undefined, sortDirection: undefined });
      return;
    }
    const [sortBy, sortDirection] = value.split(",");
    updateFilters({ sortBy, sortDirection });
  };

  const handleProductClick = useCallback(
    (productId: number) => {
      router.push(`/admin/products/${productId}`);
    },
    [router],
  );

  const handleSearch = (value: string) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`/admin/products?${params.toString()}`);
  };

  return (
    <>
      <AdminHeader title="보틀관리" onToggleSidebar={toggle} searchQuery={searchQuery} onSearch={handleSearch} />

      <div className="p-8">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/products/new")}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
          >
            <Plus size={16} />
            보틀 등록
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <FilterHeader
                    label="ID"
                    filterKey="sortBy"
                    options={[...SORT_OPTIONS.id]}
                    currentValue={currentSort}
                    isActive={searchParams.sortBy === "ID"}
                    onSelect={handleSort}
                    dropdownWidth="w-32"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="제품명"
                    filterKey="sortBy"
                    options={[...SORT_OPTIONS.name]}
                    currentValue={currentSort}
                    isActive={searchParams.sortBy === "NAME"}
                    onSelect={handleSort}
                    dropdownWidth="w-36"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="브랜드"
                    filterKey="brand"
                    options={brandOptions}
                    currentValue={getFilterValue("brand")}
                    onSelect={updateFilter}
                    dropdownWidth="w-40"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="증류소"
                    filterKey="distillery"
                    options={distilleryOptions}
                    currentValue={getFilterValue("distillery")}
                    onSelect={updateFilter}
                    dropdownWidth="w-40 max-h-60 overflow-y-auto"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="시리즈"
                    filterKey="series"
                    options={seriesOptions}
                    currentValue={getFilterValue("series")}
                    onSelect={updateFilter}
                    dropdownWidth="w-40 max-h-60 overflow-y-auto"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="캐스크타입"
                    filterKey="caskType"
                    options={caskTypeOptions}
                    currentValue={getFilterValue("caskType")}
                    onSelect={updateFilter}
                    dropdownWidth="w-40 max-h-60 overflow-y-auto"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="도수"
                    filterKey="sortBy"
                    options={[...SORT_OPTIONS.abv]}
                    currentValue={currentSort}
                    isActive={searchParams.sortBy === "ABV"}
                    onSelect={handleSort}
                    dropdownWidth="w-32"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="용량"
                    filterKey="sortBy"
                    options={[...SORT_OPTIONS.capacity]}
                    currentValue={currentSort}
                    isActive={searchParams.sortBy === "CAPACITY"}
                    onSelect={handleSort}
                    dropdownWidth="w-32"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="병입일"
                    filterKey="sortBy"
                    options={[...SORT_OPTIONS.bottledDate]}
                    currentValue={currentSort}
                    isActive={searchParams.sortBy === "BOTTLED_DATE"}
                    onSelect={handleSort}
                    dropdownWidth="w-36"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="노출"
                    filterKey="visible"
                    options={visibleOptions}
                    currentValue={getFilterValue("visible")}
                    onSelect={updateFilter}
                    dropdownWidth="w-24"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">관리</th>
                </tr>
              </thead>
              <ProductsTableBody products={products} onProductClick={handleProductClick} />
            </table>
          </div>

          <Pagination
            totalItems={totalElements}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            searchParams={searchParams}
            basePath="/admin/products"
          />
        </div>
      </div>
    </>
  );
}
