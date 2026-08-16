"use client";
import { AdminBottleSeriesResponse } from "@/apis/generated/api";
import { SearchParams } from "@/types/search";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import FilterHeader from "../../_components/FilterHeader";
import Pagination from "../../_components/Pagination";
import { useTableFilter } from "../../_components/useTableFilter";
import SeriesTableBody from "./SeriesTableBody";

interface SeriesListProps {
  searchParams: SearchParams<{
    brand?: string;
    sort?: string;
    visible?: string;
  }>;
  series: AdminBottleSeriesResponse[];
  totalElements: number;
}

const SeriesList = ({ searchParams, series, totalElements }: SeriesListProps) => {
  console.log("series,", series);
  const { toggle } = useSidebar();
  const router = useRouter();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const searchQuery = searchParams.q || "";

  const { getFilterValue, updateFilter } = useTableFilter({
    searchParams,
    basePath: "/admin/series",
  });

  const brandOptions = [
    { value: "all", label: "전체" },
    ...new Map(
      series.map(({ brand }) => {
        const value = brand ?? "";
        return [value, { value, label: value }];
      }),
    ).values(),
  ];
  console.log("brandOptions", brandOptions);
  const visibilityOptions = [
    { value: "all", label: "전체" },
    { value: "true", label: "공개" },
    { value: "false", label: "비공개" },
  ];

  const idSortOptions = [
    { value: "id,desc", label: "ID 내림차순" },
    { value: "id,asc", label: "ID 오름차순" },
  ];

  const handleSeriesClick = useCallback(
    (seriesId: number) => {
      router.push(`/admin/series/${seriesId}`);
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
    router.push(`/admin/series?${params.toString()}`);
  };

  return (
    <>
      <AdminHeader title="시리즈 관리" onToggleSidebar={toggle} searchQuery={searchQuery} onSearch={handleSearch} />
      <div className="p-8">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/products/new")}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
          >
            <Plus size={16} />
            시리즈 등록
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
                  <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">
                    시리즈명
                  </th>
                  <FilterHeader
                    label="브랜드"
                    filterKey="brand"
                    options={brandOptions}
                    currentValue={getFilterValue("brand")}
                    onSelect={updateFilter}
                    dropdownWidth="w-40"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                  <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">생성일</th>
                  <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">수정일</th>
                  <FilterHeader
                    label="visible"
                    filterKey="visible"
                    options={visibilityOptions}
                    currentValue={getFilterValue("visible")}
                    isActive={visibilityOptions.some((option) => option.value === searchParams.visible)}
                    onSelect={updateFilter}
                    dropdownWidth="w-36"
                    className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase"
                  />
                </tr>
              </thead>
              <SeriesTableBody series={series} onSeriesClick={handleSeriesClick} />
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
};

export default SeriesList;
