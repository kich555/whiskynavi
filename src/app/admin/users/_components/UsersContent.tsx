"use client";

import type { AdminUserResponse } from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import FilterHeader from "../../_components/FilterHeader";
import Pagination from "../../_components/Pagination";
import { useTableFilter } from "../../_components/useTableFilter";
import { ROLE_COLOR_MAP, ROLE_LABEL_MAP } from "../../constants";
import UserDeleteModal from "../[userId]/_components/UserDeleteModal";

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

// 필터 옵션 정의
const ROLE_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "ROLE_SUPER_ADMIN", label: "총괄 관리자" },
  { value: "ROLE_ADMIN", label: "관리자" },
  { value: "ROLE_USER", label: "일반 회원" },
];

const NAVI_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "Y", label: "가입" },
  { value: "N", label: "미가입" },
];

const TALES_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "Y", label: "가입" },
  { value: "N", label: "미가입" },
];

const BUSINESS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "ROLE_TRAILNTALE_BUSINESS", label: "트레일테일" },
  { value: "ROLE_COMMUNITY_BUSINESS", label: "커뮤니티" },
  { value: "ROLE_PICK_UP_BUSINESS", label: "픽업" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "ACTIVE", label: "활성" },
  { value: "INACTIVE", label: "비활성" },
];

interface UsersContentProps {
  searchParams: {
    page?: string;
    limit?: string;
    q?: string;
    role?: string;
    navi?: string;
    tales?: string;
    business?: string;
    status?: string;
    sortBy?: string;
    sortDirection?: string;
  };
  users: AdminUserResponse[];
  totalElements: number;
}

export default function UsersContent({ searchParams, users, totalElements }: UsersContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const searchQuery = searchParams.q || "";

  const { getFilterValue, updateFilter } = useTableFilter({
    searchParams,
    basePath: "/admin/users",
  });

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
    router.push(`/admin/users?${params.toString()}`);
  };
  return (
    <>
      <AdminHeader title="회원 관리" onToggleSidebar={toggle} searchQuery={searchQuery} onSearch={handleSearch} />

      <div className="p-8">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">ID</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">이름</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">사용자명</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">이메일</th>
                  <FilterHeader
                    label="회원 유형"
                    filterKey="role"
                    options={ROLE_OPTIONS}
                    currentValue={getFilterValue("role")}
                    onSelect={updateFilter}
                    dropdownWidth="w-40"
                  />
                  <FilterHeader
                    label="내비"
                    filterKey="navi"
                    options={NAVI_OPTIONS}
                    currentValue={getFilterValue("navi")}
                    onSelect={updateFilter}
                    iconSize={10}
                    dropdownWidth="w-28"
                    className="typo-bold-10 w-20 px-2 py-2 text-left text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="테일즈"
                    filterKey="tales"
                    options={TALES_OPTIONS}
                    currentValue={getFilterValue("tales")}
                    onSelect={updateFilter}
                    iconSize={10}
                    dropdownWidth="w-28"
                    className="typo-bold-10 w-20 px-2 py-2 text-left text-gray-700 uppercase"
                  />
                  <FilterHeader
                    label="업장"
                    filterKey="business"
                    options={BUSINESS_OPTIONS}
                    currentValue={getFilterValue("business")}
                    onSelect={updateFilter}
                  />
                  <FilterHeader
                    label="상태"
                    filterKey="status"
                    options={STATUS_OPTIONS}
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
                        <td className="px-4 py-3 text-sm text-gray-900">{user.id}</td>
                        <td className="typo-medium-14 px-4 py-3 text-gray-900">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">@{user.username}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm">
                          {memberType ? (
                            <Badge className={memberType.color}>{memberType.label}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {user.roles?.includes("ROLE_WHISKYNAVI_MEMBER") ? (
                            <Badge className="bg-amber-100 text-amber-700">내비</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {user.roles?.includes("ROLE_WHISKYTALES_MEMBER") ? (
                            <Badge className="bg-blue-100 text-blue-700">테일즈</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
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
                        <td className="px-4 py-3 text-sm">
                          <Badge
                            className={
                              user.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }
                          >
                            {user.status === "ACTIVE" ? "활성" : "비활성"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatJoinDate(user.createdAt ?? "")}</td>
                        <td className="px-4 py-3 text-sm">
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
