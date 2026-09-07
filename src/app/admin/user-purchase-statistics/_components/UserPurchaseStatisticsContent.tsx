"use client";

import type {
  AdminUserPurchaseStatisticsResponse,
  GetApiV2AdminUsersPurchaseStatisticsSortBy,
} from "@/apis/generated/api";
import { createSearchParams } from "@/app/admin/_lib/searchParams";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, ChevronsUpDown, Clock3, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";
import { requestPurchaseStatisticsRefreshAction } from "../actions";
import {
  PURCHASE_STATISTICS_BOOLEAN_FILTER_OPTIONS,
  PURCHASE_STATISTICS_PURCHASE_FILTER_OPTIONS,
  PURCHASE_STATISTICS_SEARCH_FIELD_OPTIONS,
  PURCHASE_STATISTICS_SORT_FIELDS,
  type PurchaseStatisticsFilterValue,
  type UserPurchaseStatisticsSearchParams,
} from "../filters";

const BASE_PATH = "/admin/user-purchase-statistics";
const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

type FilterKey = "naviMember" | "talesMember" | "hasNaviPurchase" | "hasTalesPurchase";

interface UserPurchaseStatisticsContentProps {
  searchParams: UserPurchaseStatisticsSearchParams;
  statistics: AdminUserPurchaseStatisticsResponse[];
  totalElements: number;
  statisticsYear: number;
  calculatedAt: string | null;
}

function formatCalculatedAt(value: string | null): string {
  if (!value) return "집계 대기 중";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function MemberBadge({ member }: { member: boolean }) {
  return member ? (
    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
      회원
    </Badge>
  ) : (
    <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-500">
      비회원
    </Badge>
  );
}

export default function UserPurchaseStatisticsContent({
  searchParams,
  statistics,
  totalElements,
  statisticsYear,
  calculatedAt,
}: UserPurchaseStatisticsContentProps) {
  const router = useRouter();
  const { toggle } = useSidebar();
  const [isRefreshPending, startRefreshTransition] = useTransition();
  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const searchField = searchParams.searchField ?? "NAME";
  const sortBy = searchParams.sortBy ?? "ID";
  const sortDirection = searchParams.sortDirection ?? "DESC";

  const navigate = (params: URLSearchParams) => {
    const query = params.toString();
    router.push(query ? `${BASE_PATH}?${query}` : BASE_PATH);
  };

  const handleSearch = (value: string) => {
    const params = createSearchParams(searchParams);
    if (value) params.set("q", value);
    else params.delete("q");
    params.set("searchField", searchField);
    params.set("page", "1");
    navigate(params);
  };

  const handleSearchFieldChange = (value: string) => {
    const params = createSearchParams(searchParams);
    params.set("searchField", value);
    params.set("page", "1");
    navigate(params);
  };

  const handleFilterChange = (key: FilterKey, value: PurchaseStatisticsFilterValue) => {
    const params = createSearchParams(searchParams);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    params.set("page", "1");
    navigate(params);
  };

  const handleSort = (field: GetApiV2AdminUsersPurchaseStatisticsSortBy) => {
    const params = createSearchParams(searchParams);
    params.set("sortBy", field);
    params.set("sortDirection", sortBy === field && sortDirection === "ASC" ? "DESC" : "ASC");
    params.set("page", "1");
    navigate(params);
  };

  const getSortAriaSort = (field: GetApiV2AdminUsersPurchaseStatisticsSortBy): "none" | "ascending" | "descending" => {
    if (sortBy !== field) return "none";
    return sortDirection === "ASC" ? "ascending" : "descending";
  };

  const renderSortIcon = (field: GetApiV2AdminUsersPurchaseStatisticsSortBy) => {
    if (sortBy !== field) return <ChevronsUpDown size={12} />;
    return sortDirection === "ASC" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const renderSortableHeader = (field: GetApiV2AdminUsersPurchaseStatisticsSortBy, className = "text-left") => (
    <th
      className={`typo-bold-12 px-4 py-3 whitespace-nowrap text-gray-700 uppercase ${className}`}
      aria-sort={getSortAriaSort(field)}
    >
      <button
        type="button"
        onClick={() => handleSort(field)}
        className={`inline-flex cursor-pointer items-center gap-1 hover:text-amber-600 ${
          sortBy === field ? "text-amber-600" : ""
        }`}
        aria-label={`${PURCHASE_STATISTICS_SORT_FIELDS[field]} 정렬`}
      >
        {PURCHASE_STATISTICS_SORT_FIELDS[field]}
        {renderSortIcon(field)}
      </button>
    </th>
  );

  const requestRefresh = () => {
    if (!window.confirm("올해 구매 통계 전체 갱신을 요청하시겠습니까? 집계 완료까지 시간이 걸릴 수 있습니다.")) {
      return;
    }

    startRefreshTransition(async () => {
      const result = await requestPurchaseStatisticsRefreshAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`${result.statisticsYear}년 구매 통계 갱신 요청을 접수했습니다. 완료 후 다시 확인해주세요.`);
    });
  };

  return (
    <>
      <AdminHeader
        title="회원 구매 통계"
        onToggleSidebar={toggle}
        searchQuery={searchParams.q ?? ""}
        searchField={searchField}
        searchFieldOptions={[...PURCHASE_STATISTICS_SEARCH_FIELD_OPTIONS]}
        onSearch={handleSearch}
        onSearchFieldChange={handleSearchFieldChange}
      />

      <main className="space-y-4 p-8">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
          <div>
            <p className="typo-bold-16 text-amber-950">{statisticsYear}년 예약 확정 구매 통계</p>
            <p className="typo-medium-12 mt-1 text-amber-800">
              취소 주문과 관리자 수동 등록을 제외하며, 매일 오전 3시에 올해 전체 범위를 다시 집계합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="typo-medium-12 flex items-center gap-2 text-amber-800">
              <Clock3 size={16} aria-hidden="true" />
              {calculatedAt ? `마지막 집계 ${formatCalculatedAt(calculatedAt)}` : "매일 오전 3시 집계"}
            </div>
            <button
              type="button"
              onClick={requestRefresh}
              disabled={isRefreshPending}
              className="typo-bold-12 inline-flex h-9 items-center gap-2 rounded-md bg-amber-700 px-3 text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              <RefreshCw size={15} aria-hidden="true" className={isRefreshPending ? "animate-spin" : undefined} />
              {isRefreshPending ? "요청 중..." : "지금 갱신"}
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4" aria-label="구매 통계 필터">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              label="내비 회원 여부"
              value={searchParams.naviMember ?? "all"}
              options={PURCHASE_STATISTICS_BOOLEAN_FILTER_OPTIONS}
              onChange={(value) => handleFilterChange("naviMember", value)}
            />
            <FilterSelect
              label="내비 구매 여부"
              value={searchParams.hasNaviPurchase ?? "all"}
              options={PURCHASE_STATISTICS_PURCHASE_FILTER_OPTIONS}
              onChange={(value) => handleFilterChange("hasNaviPurchase", value)}
            />
            <FilterSelect
              label="테일즈 회원 여부"
              value={searchParams.talesMember ?? "all"}
              options={PURCHASE_STATISTICS_BOOLEAN_FILTER_OPTIONS}
              onChange={(value) => handleFilterChange("talesMember", value)}
            />
            <FilterSelect
              label="테일즈 구매 여부"
              value={searchParams.hasTalesPurchase ?? "all"}
              options={PURCHASE_STATISTICS_PURCHASE_FILTER_OPTIONS}
              onChange={(value) => handleFilterChange("hasTalesPurchase", value)}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {renderSortableHeader("ID")}
                  {renderSortableHeader("NAME")}
                  {renderSortableHeader("USERNAME")}
                  {renderSortableHeader("NAVI_MEMBER")}
                  {renderSortableHeader("NAVI_BOTTLE_QUANTITY", "text-right")}
                  {renderSortableHeader("NAVI_BOTTLE_KIND_COUNT", "text-right")}
                  {renderSortableHeader("TALES_MEMBER")}
                  {renderSortableHeader("TALES_BOTTLE_QUANTITY", "text-right")}
                  {renderSortableHeader("TALES_BOTTLE_KIND_COUNT", "text-right")}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statistics.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="typo-medium-14 px-4 py-12 text-center text-gray-500">
                      조건에 맞는 회원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  statistics.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="typo-medium-14 px-4 py-3 text-gray-700">{item.id}</td>
                      <td className="typo-medium-14 px-4 py-3 font-medium whitespace-nowrap text-gray-900">
                        {item.name || "-"}
                      </td>
                      <td className="typo-medium-14 px-4 py-3 whitespace-nowrap text-gray-700">
                        {item.username ? `@${item.username}` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <MemberBadge member={item.naviMember ?? false} />
                      </td>
                      <td className="typo-medium-14 px-4 py-3 text-right text-gray-800">
                        {NUMBER_FORMATTER.format(item.naviBottleQuantity ?? 0)}
                      </td>
                      <td className="typo-medium-14 px-4 py-3 text-right text-gray-800">
                        {NUMBER_FORMATTER.format(item.naviBottleKindCount ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <MemberBadge member={item.talesMember ?? false} />
                      </td>
                      <td className="typo-medium-14 px-4 py-3 text-right text-gray-800">
                        {NUMBER_FORMATTER.format(item.talesBottleQuantity ?? 0)}
                      </td>
                      <td className="typo-medium-14 px-4 py-3 text-right text-gray-800">
                        {NUMBER_FORMATTER.format(item.talesBottleKindCount ?? 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={totalElements}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            searchParams={searchParams}
            basePath={BASE_PATH}
            alwaysVisible
          />
        </section>
      </main>
    </>
  );
}

interface FilterSelectProps {
  label: string;
  value: PurchaseStatisticsFilterValue;
  options: ReadonlyArray<{ value: PurchaseStatisticsFilterValue; label: string }>;
  onChange: (value: PurchaseStatisticsFilterValue) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="space-y-1">
      <span className="typo-medium-12 block text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as PurchaseStatisticsFilterValue)}
        className="typo-medium-14 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
