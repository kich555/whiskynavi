"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import { useTransition } from "react";
import { toast } from "sonner";

import type { AdminUserResponse } from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/formatters";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";
import { ROLE_COLOR_MAP, ROLE_LABEL_MAP } from "../../constants";
import { removeMembershipAction } from "../actions";
import AddMemberModal from "./AddMemberModal";
import RemoveMemberConfirmModal from "./RemoveMemberConfirmModal";

type UserRole = string;

type MembershipBrand = "navi" | "tales";

const MEMBERSHIP_ROLES: UserRole[] = ["ROLE_WHISKYNAVI_MEMBER", "ROLE_WHISKYTALES_MEMBER"];

const BUSINESS_ROLES: UserRole[] = [
  "ROLE_BUSINESS",
  "ROLE_TRAILNTALE_BUSINESS",
  "ROLE_COMMUNITY_BUSINESS",
  "ROLE_PICK_UP_BUSINESS",
];

const getMemberType = (roles: UserRole[]): string => {
  const hasBusiness = BUSINESS_ROLES.some((r) => roles.includes(r));
  return hasBusiness ? "업장" : "일반";
};

interface MembershipContentProps {
  searchParams: {
    brand?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortDirection?: string;
  };
  brand: MembershipBrand;
  users: AdminUserResponse[];
  totalElements: number;
}

export default function MembershipContent({ searchParams, brand, users, totalElements }: MembershipContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const sortBy = searchParams.sortBy || "createdAt";
  const sortDirection = searchParams.sortDirection || "desc";

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    Object.entries(updates).forEach(([k, v]) => {
      params.set(k, v);
    });
    router.push(`/admin/membership?${params.toString()}`);
  };

  const handleBrandChange = (newBrand: MembershipBrand) => {
    updateParams({ brand: newBrand, page: "1" });
  };

  const handleSortChange = (newSortBy: string) => {
    updateParams({ sortBy: newSortBy, page: "1" });
  };

  const handleSortDirectionToggle = () => {
    updateParams({
      sortDirection: sortDirection === "asc" ? "desc" : "asc",
    });
  };

  const handleAddMember = () => {
    overlay.open(({ isOpen, close }) => <AddMemberModal isOpen={isOpen} close={close} brand={brand} />);
  };

  const handleRemoveMember = (user: AdminUserResponse) => {
    overlay.open(({ isOpen, close }) => (
      <RemoveMemberConfirmModal
        isOpen={isOpen}
        close={close}
        userName={user.name ?? ""}
        username={user.username ?? ""}
        onConfirm={() => {
          startTransition(async () => {
            const result = await removeMembershipAction(user.id!, brand);
            if (!result.success) {
              toast.error(result.error);
            }
            router.refresh();
          });
        }}
      />
    ));
  };

  return (
    <>
      <AdminHeader title="멤버십 관리" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        {/* 브랜드 선택 탭 및 액션 버튼 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleBrandChange("navi")}
              className={`cursor-pointer rounded-lg px-6 py-3 font-semibold transition-colors ${
                brand === "navi" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              위스키내비
            </button>
            <button
              type="button"
              onClick={() => handleBrandChange("tales")}
              className={`cursor-pointer rounded-lg px-6 py-3 font-semibold transition-colors ${
                brand === "tales" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              더 위스키테일즈
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/membership/benefits")}
              className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              혜택 관리
            </button>
            <button
              type="button"
              onClick={handleAddMember}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-amber-700"
            >
              <UserPlus size={16} />
              멤버십 추가
            </button>
          </div>
        </div>

        {/* 정렬 및 요약 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="typo-medium-14 text-gray-600">정렬:</label>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger size="sm" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">가입일</SelectItem>
                <SelectItem value="name">이름</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={handleSortDirectionToggle}
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 typo-medium-14 transition-colors hover:bg-gray-50"
            >
              {sortDirection === "asc" ? "↑ 오름차순" : "↓ 내림차순"}
            </button>
          </div>
          <div className="flex items-center gap-2 typo-medium-14 text-gray-600">
            <span>총 {totalElements}명의 멤버</span>
          </div>
        </div>

        {/* 멤버십 회원 목록 테이블 */}
        <div
          className={`overflow-hidden rounded-lg border border-gray-200 bg-white transition-opacity ${isPending ? "pointer-events-none opacity-60" : ""}`}
        >
          <table className="w-full table-fixed">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="typo-bold-10 w-16 px-3 py-2 text-left text-gray-700 uppercase">ID</th>
                <th className="typo-bold-10 w-40 px-3 py-2 text-left text-gray-700 uppercase">이름</th>
                <th className="typo-bold-10 w-44 px-3 py-2 text-left text-gray-700 uppercase">닉네임</th>
                <th className="typo-bold-10 w-44 px-3 py-2 text-left text-gray-700 uppercase">전화번호</th>
                <th className="typo-bold-10 w-28 px-3 py-2 text-left text-gray-700 uppercase">회원유형</th>
                <th className="typo-bold-10 w-32 px-3 py-2 text-left text-gray-700 uppercase">멤버십</th>
                <th className="typo-bold-10 w-28 px-3 py-2 text-left text-gray-700 uppercase">가입일</th>
                <th className="typo-bold-10 w-20 px-3 py-2 text-left text-gray-700 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 && !isPending ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    멤버십 회원이 없습니다.
                  </td>
                </tr>
              ) : users.length === 0 && isPending ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={`skeleton-${i}-${j}`} className="px-3 py-2">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                users.map((user) => {
                  const roles = user.roles ?? [];
                  const memberType = getMemberType(roles);
                  const membershipRoles = MEMBERSHIP_ROLES.filter((r) => roles.includes(r));

                  return (
                    <tr key={user.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-3 py-2 typo-medium-12 text-gray-900">{user.id}</td>
                      <td className="typo-medium-12 px-3 py-2 text-gray-900">{user.name}</td>
                      <td className="px-3 py-2 typo-medium-12 text-gray-600">@{user.username}</td>
                      <td className="px-3 py-2 typo-medium-12 text-gray-600">{user.phone || "-"}</td>
                      <td className="px-3 py-2 typo-medium-12">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            memberType === "업장" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {memberType}
                        </span>
                      </td>
                      <td className="px-3 py-2 typo-medium-12">
                        <div className="flex flex-wrap gap-1">
                          {membershipRoles.map((role) => (
                            <Badge key={role} className={ROLE_COLOR_MAP[role]}>
                              {ROLE_LABEL_MAP[role]}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 typo-medium-12 text-gray-600">{formatDate(user.createdAt ?? "")}</td>
                      <td className="px-3 py-2 typo-medium-12">
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(user)}
                          className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="멤버십 해제"
                        >
                          <UserMinus size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <Pagination
            totalItems={totalElements}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            searchParams={searchParams}
            basePath="/admin/membership"
          />
        </div>
      </div>
    </>
  );
}
