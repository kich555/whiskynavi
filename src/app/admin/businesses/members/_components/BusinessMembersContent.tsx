"use client";

import type { AdminBusinessUserResponse } from "@/apis/generated/api";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import FilterHeader from "@/app/admin/_components/FilterHeader";
import Pagination from "@/app/admin/_components/Pagination";
import { useTableFilter } from "@/app/admin/_components/useTableFilter";
import {
  BUSINESS_MEMBERS_SORT_OPTIONS,
  DEFAULT_BUSINESS_MEMBERS_SORT,
  type BusinessMembersSort,
} from "@/app/admin/businesses/members/sort";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  HOUSEHOLD: "가정용",
  ENTERTAINMENT: "유흥용",
};

const BUSINESS_TYPE_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "HOUSEHOLD", label: "가정용" },
  { value: "ENTERTAINMENT", label: "유흥용" },
] as const;

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "Y", label: "있음" },
  { value: "N", label: "없음" },
] as const;

const BUSINESS_MEMBER_SEARCH_FIELD_OPTIONS = [
  { value: "businessName", label: "사업장 명" },
  { value: "userName", label: "사용자명" },
] as const;

const formatBusinessType = (businessType?: string): string => {
  if (!businessType) return "-";
  return BUSINESS_TYPE_LABEL[businessType] ?? businessType;
};

const hasRole = (
  member: AdminBusinessUserResponse,
  roleKey: "hasBusinessRole" | "hasTrailntaleBusinessRole" | "hasCommunityBusinessRole" | "hasPickupRole",
  roleName: NonNullable<AdminBusinessUserResponse["roles"]>[number],
) => {
  const value = (member as Record<string, unknown>)[roleKey];
  return typeof value === "boolean" ? value : (member.roles?.includes(roleName) ?? false);
};

interface BusinessMembersContentProps {
  searchParams: {
    page?: string;
    limit?: string;
    sort?: BusinessMembersSort;
    q?: string;
    searchField?: string;
    businessType?: string;
    hasBusinessRole?: string;
    hasTrailntaleBusinessRole?: string;
    hasCommunityBusinessRole?: string;
    hasPickupRole?: string;
  };
  members: AdminBusinessUserResponse[];
  totalElements: number;
}

export default function BusinessMembersContent({ searchParams, members, totalElements }: BusinessMembersContentProps) {
  const router = useRouter();
  const { toggle } = useSidebar();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const currentSort = searchParams.sort ?? DEFAULT_BUSINESS_MEMBERS_SORT;
  const searchQuery = searchParams.q || "";
  const searchField = searchParams.searchField ?? "businessName";

  const { getFilterValue, updateFilter } = useTableFilter({
    searchParams,
    basePath: "/admin/businesses/members",
  });

  const buildParams = () => {
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    return params;
  };

  const handleSortChange = (value: string) => {
    const params = buildParams();
    params.set("sort", value);
    params.set("page", "1");

    router.push(`/admin/businesses/members?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    const params = buildParams();
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    params.set("searchField", searchField);
    params.set("page", "1");
    router.push(`/admin/businesses/members?${params.toString()}`);
  };

  const handleSearchFieldChange = (value: string) => {
    const params = buildParams();
    params.set("searchField", value);
    params.set("page", "1");
    router.push(`/admin/businesses/members?${params.toString()}`);
  };

  return (
    <>
      <AdminHeader
        title="업장 관리"
        onToggleSidebar={toggle}
        searchQuery={searchQuery}
        searchField={searchField}
        searchFieldOptions={[...BUSINESS_MEMBER_SEARCH_FIELD_OPTIONS]}
        onSearch={handleSearch}
        onSearchFieldChange={handleSearchFieldChange}
      />

      <div className="p-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="typo-medium-14 text-gray-600">총 {totalElements}건</p>

          <div className="flex items-center gap-2">
            <Label htmlFor="business-members-sort" className="typo-medium-14 text-gray-600">
              정렬
            </Label>
            <select
              id="business-members-sort"
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 typo-medium-14 text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {BUSINESS_MEMBERS_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">업장ID</th>
                  <FilterHeader
                    label="사업자 유형"
                    filterKey="businessType"
                    options={[...BUSINESS_TYPE_OPTIONS]}
                    currentValue={getFilterValue("businessType")}
                    onSelect={updateFilter}
                    dropdownWidth="w-32"
                  />
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">사업장 명</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">사용자명</th>
                  <FilterHeader
                    label="사업자 권한"
                    filterKey="hasBusinessRole"
                    options={[...ROLE_FILTER_OPTIONS]}
                    currentValue={getFilterValue("hasBusinessRole")}
                    onSelect={updateFilter}
                    dropdownWidth="w-28"
                  />
                  <FilterHeader
                    label="트레일앤테일"
                    filterKey="hasTrailntaleBusinessRole"
                    options={[...ROLE_FILTER_OPTIONS]}
                    currentValue={getFilterValue("hasTrailntaleBusinessRole")}
                    onSelect={updateFilter}
                    dropdownWidth="w-28"
                  />
                  <FilterHeader
                    label="커뮤니티"
                    filterKey="hasCommunityBusinessRole"
                    options={[...ROLE_FILTER_OPTIONS]}
                    currentValue={getFilterValue("hasCommunityBusinessRole")}
                    onSelect={updateFilter}
                    dropdownWidth="w-28"
                  />
                  <FilterHeader
                    label="픽업"
                    filterKey="hasPickupRole"
                    options={[...ROLE_FILTER_OPTIONS]}
                    currentValue={getFilterValue("hasPickupRole")}
                    onSelect={updateFilter}
                    dropdownWidth="w-28"
                  />
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      업장이 없습니다.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr
                      key={member.businessId}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => router.push(`/admin/businesses/members/${member.businessId}`)}
                    >
                      <td className="px-4 py-3 typo-medium-14 text-gray-900">{member.businessId}</td>
                      <td className="px-4 py-3 typo-medium-14 text-gray-600">{formatBusinessType(member.businessType)}</td>
                      <td className="typo-medium-14 max-w-[220px] truncate px-4 py-3 text-gray-900">
                        {member.businessName ?? "-"}
                      </td>
                      <td className="px-4 py-3 typo-medium-14 text-gray-600">{member.username ?? "-"}</td>
                      <td className="px-4 py-3 typo-medium-14">
                        {hasRole(member, "hasBusinessRole", "ROLE_BUSINESS") ? (
                          <Badge className="bg-purple-100 text-purple-700">있음</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500">없음</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 typo-medium-14">
                        {hasRole(member, "hasTrailntaleBusinessRole", "ROLE_TRAILNTALE_BUSINESS") ? (
                          <Badge className="bg-blue-100 text-blue-700">있음</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500">없음</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 typo-medium-14">
                        {hasRole(member, "hasCommunityBusinessRole", "ROLE_COMMUNITY_BUSINESS") ? (
                          <Badge className="bg-emerald-100 text-emerald-700">있음</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500">없음</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 typo-medium-14">
                        {hasRole(member, "hasPickupRole", "ROLE_PICK_UP_BUSINESS") ? (
                          <Badge className="bg-amber-100 text-amber-700">있음</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500">없음</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 typo-medium-14">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/businesses/members/${member.businessId}`)}
                            className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                            title="상세"
                            aria-label="상세"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
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
            basePath="/admin/businesses/members"
          />
        </div>
      </div>
    </>
  );
}
