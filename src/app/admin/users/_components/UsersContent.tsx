"use client";

import type { AdminUserResponse } from "@/apis/generated/api";
import { createSearchParams } from "@/app/admin/_lib/searchParams";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, ChevronsUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import FilterHeader from "../../_components/FilterHeader";
import Pagination from "../../_components/Pagination";
import { useTableFilter } from "../../_components/useTableFilter";
import { ROLE_COLOR_MAP, ROLE_LABEL_MAP } from "../../constants";
import UserDeleteModal from "../[userId]/_components/UserDeleteModal";
import {
  BUSINESS_OPTIONS,
  NAVI_OPTIONS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  TALES_OPTIONS,
  USER_SEARCH_FIELD_OPTIONS,
  buildAdminUserRoleFilterParams,
  getAdminUserRoleFilterValue,
  isAdminUserRoleFilterKey,
  resolveSearchField,
  type AdminUsersSearchParams,
} from "../filters";

const SORTABLE_USER_FIELD_LABELS = {
  name: "이름",
  username: "사용자명",
} as const;

type SortableUserField = keyof typeof SORTABLE_USER_FIELD_LABELS;

// 헬퍼 함수: 회원 유형 (SUPER_ADMIN > ADMIN > 나머지 일반 roles)
const MEMBER_TYPE_ROLES: string[] = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"];

const getMemberType = (roles: string[]): { label: string; color: string } | null => {
  for (const role of MEMBER_TYPE_ROLES) {
    if (roles.includes(role)) {
      return { label: ROLE_LABEL_MAP[role], color: ROLE_COLOR_MAP[role] };
    }
  }
  if (roles.includes("ROLE_USER")) {
    return { label: ROLE_LABEL_MAP.ROLE_USER, color: ROLE_COLOR_MAP.ROLE_USER };
  }
  return null;
};

// 헬퍼 함수: 비즈니스 roles 추출
const BUSINESS_ROLES: string[] = [
  "ROLE_BUSINESS",
  "ROLE_TRAILNTALE_BUSINESS",
  "ROLE_COMMUNITY_BUSINESS",
  "ROLE_PICK_UP_BUSINESS",
];

const SUB_BUSINESS_ROLES: string[] = ["ROLE_TRAILNTALE_BUSINESS", "ROLE_COMMUNITY_BUSINESS", "ROLE_PICK_UP_BUSINESS"];

const getBusinessRoles = (roles: string[]): { label: string; color: string }[] => {
  const hasSub = SUB_BUSINESS_ROLES.some((role) => roles.includes(role));
  return BUSINESS_ROLES.filter((role) => roles.includes(role) && !(hasSub && role === "ROLE_BUSINESS")).map((role) => ({
    label: ROLE_LABEL_MAP[role],
    color: ROLE_COLOR_MAP[role],
  }));
};

// 헬퍼 함수: createdAt을 가입일 형식으로 변환
const formatJoinDate = (createdAt: string): string => {
  const date = new Date(createdAt);
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
};

interface UsersContentProps {
  searchParams: AdminUsersSearchParams;
  users: AdminUserResponse[];
  totalElements: number;
}

export default function UsersContent({ searchParams, users, totalElements }: UsersContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const searchQuery = searchParams.q || "";
  const searchField = resolveSearchField(searchParams.searchField);
  const sortBy = searchParams.sortBy || "createdAt";
  const sortDirection = searchParams.sortDirection === "asc" ? "asc" : "desc";

  const { getFilterValue, updateFilter } = useTableFilter({
    searchParams,
    basePath: "/admin/users",
  });

  const buildParams = () => {
    return createSearchParams(searchParams);
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
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSearchFieldChange = (value: string) => {
    const params = buildParams();
    params.set("searchField", resolveSearchField(value));
    params.set("page", "1");
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleRoleFilterSelect = (key: string, value: string) => {
    if (!isAdminUserRoleFilterKey(key)) {
      return;
    }

    const params = buildAdminUserRoleFilterParams(searchParams, key, value);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSort = (field: SortableUserField) => {
    const params = buildParams();
    params.set("sortBy", field);
    params.set("sortDirection", sortBy === field && sortDirection === "asc" ? "desc" : "asc");
    params.set("page", "1");
    router.push(`/admin/users?${params.toString()}`);
  };

  const getSortAriaSort = (field: SortableUserField) => {
    if (sortBy !== field) {
      return "none";
    }

    return sortDirection === "asc" ? "ascending" : "descending";
  };

  const getSortAriaLabel = (field: SortableUserField) => {
    const nextDirectionLabel = sortBy === field && sortDirection === "asc" ? "내림차순" : "오름차순";
    return `${SORTABLE_USER_FIELD_LABELS[field]} ${nextDirectionLabel} 정렬`;
  };

  const renderSortIcon = (field: SortableUserField) => {
    if (sortBy !== field) {
      return <ChevronsUpDown size={12} />;
    }

    return sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  return (
    <>
      <AdminHeader
        title="회원 관리"
        onToggleSidebar={toggle}
        searchQuery={searchQuery}
        searchField={searchField}
        searchFieldOptions={[...USER_SEARCH_FIELD_OPTIONS]}
        onSearch={handleSearch}
        onSearchFieldChange={handleSearchFieldChange}
      />

      <div className="p-8">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">ID</th>
                  <th
                    className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase"
                    aria-sort={getSortAriaSort("name")}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className={`flex cursor-pointer items-center gap-1 hover:text-amber-600 ${
                        sortBy === "name" ? "text-amber-600" : ""
                      }`}
                      aria-label={getSortAriaLabel("name")}
                    >
                      이름
                      {renderSortIcon("name")}
                    </button>
                  </th>
                  <th
                    className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase"
                    aria-sort={getSortAriaSort("username")}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("username")}
                      className={`flex cursor-pointer items-center gap-1 hover:text-amber-600 ${
                        sortBy === "username" ? "text-amber-600" : ""
                      }`}
                      aria-label={getSortAriaLabel("username")}
                    >
                      사용자명
                      {renderSortIcon("username")}
                    </button>
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">이메일</th>
                  <FilterHeader
                    label="회원 유형"
                    filterKey="role"
                    options={[...ROLE_OPTIONS]}
                    currentValue={getAdminUserRoleFilterValue(searchParams, "role")}
                    onSelect={handleRoleFilterSelect}
                    dropdownWidth="w-40"
                  />
                  <FilterHeader
                    label="내비"
                    filterKey="navi"
                    options={[...NAVI_OPTIONS]}
                    currentValue={getAdminUserRoleFilterValue(searchParams, "navi")}
                    onSelect={handleRoleFilterSelect}
                    iconSize={10}
                    dropdownWidth="w-28"
                    className="typo-bold-10 w-20 px-2 py-2 text-left text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="테일즈"
                    filterKey="tales"
                    options={[...TALES_OPTIONS]}
                    currentValue={getAdminUserRoleFilterValue(searchParams, "tales")}
                    onSelect={handleRoleFilterSelect}
                    iconSize={10}
                    dropdownWidth="w-28"
                    className="typo-bold-10 w-20 px-2 py-2 text-left text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="업장"
                    filterKey="business"
                    options={[...BUSINESS_OPTIONS]}
                    currentValue={getAdminUserRoleFilterValue(searchParams, "business")}
                    onSelect={handleRoleFilterSelect}
                  />
                  <FilterHeader
                    label="상태"
                    filterKey="status"
                    options={[...STATUS_OPTIONS]}
                    currentValue={getFilterValue("status")}
                    onSelect={updateFilter}
                    dropdownWidth="w-32"
                  />
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">가입일</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      회원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const memberType = getMemberType(user.roles ?? []);
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-gray-50">
                        <td className="typo-medium-14 px-4 py-3 text-gray-900">{user.id}</td>
                        <td className="typo-medium-14 px-4 py-3 text-gray-900">{user.name}</td>
                        <td className="typo-medium-14 px-4 py-3 text-gray-600">@{user.username}</td>
                        <td className="typo-medium-14 px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="typo-medium-14 px-4 py-3">
                          {memberType ? (
                            <Badge className={memberType.color}>{memberType.label}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="typo-medium-14 px-4 py-3">
                          {user.roles?.includes("ROLE_WHISKYNAVI_MEMBER") ? (
                            <Badge className="bg-amber-100 text-amber-700">내비</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="typo-medium-14 px-4 py-3">
                          {user.roles?.includes("ROLE_WHISKYTALES_MEMBER") ? (
                            <Badge className="bg-blue-100 text-blue-700">테일즈</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="typo-medium-14 px-4 py-3">
                          {getBusinessRoles(user.roles ?? []).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {getBusinessRoles(user.roles ?? []).map((role) => (
                                <Badge key={role.label} className={role.color}>
                                  {role.label}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="typo-medium-14 px-4 py-3">
                          <Badge
                            className={
                              user.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }
                          >
                            {user.status === "ACTIVE" ? "활성" : "비활성"}
                          </Badge>
                        </td>
                        <td className="typo-medium-14 px-4 py-3 text-gray-600">{formatJoinDate(user.createdAt ?? "")}</td>
                        <td className="typo-medium-14 px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                              title="상세"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                              className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                              title="수정"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => overlay.open((props) => <UserDeleteModal {...props} id={user.id!} />)}
                              className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="삭제"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={totalElements}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            searchParams={searchParams}
            basePath="/admin/users"
          />
        </div>
      </div>
    </>
  );
}
