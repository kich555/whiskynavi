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
    sort?: string;
  };
  products: BottleAdminResponse[];
  totalElements: number;
  brands: string[];
  distilleries: string[];
}

export default function ProductsContent({
  searchParams,
  products,
  totalElements,
  brands,
  distilleries,
}: ProductsContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const searchQuery = searchParams.q || "";

  const { getFilterValue, updateFilter } = useTableFilter({
    searchParams,
    basePath: "/admin/products",
  });

  const brandOptions = [{ value: "all", label: "전체" }, ...brands.map((b) => ({ value: b, label: b }))];

  const distilleryOptions = [{ value: "all", label: "전체" }, ...distilleries.map((d) => ({ value: d, label: d }))];

  const idSortOptions = [
    { value: "id,desc", label: "ID 내림차순" },
    { value: "id,asc", label: "ID 오름차순" },
  ];

  const bottledDateSortOptions = [
    { value: "bottledDate,desc", label: "병입일 최신순" },
    { value: "bottledDate,asc", label: "병입일 오래된순" },
  ];

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
                    filterKey="sort"
                    options={idSortOptions}
                    currentValue={getFilterValue("sort")}
                    isActive={idSortOptions.some((option) => option.value === searchParams.sort)}
                    onSelect={updateFilter}
                    dropdownWidth="w-32"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">제품명</th>
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
                  <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">시리즈</th>
                  <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">
                    캐스크타입
                  </th>
                  <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">도수</th>
                  <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">용량</th>
                  <FilterHeader
                    label="병입일"
                    filterKey="sort"
                    options={bottledDateSortOptions}
                    currentValue={getFilterValue("sort")}
                    isActive={bottledDateSortOptions.some((option) => option.value === searchParams.sort)}
                    onSelect={updateFilter}
                    dropdownWidth="w-36"
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
