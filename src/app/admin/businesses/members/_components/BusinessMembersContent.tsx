"use client";

import type { AdminBusinessUserResponse } from "@/apis/generated/api";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import Pagination from "@/app/admin/_components/Pagination";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface BusinessMembersContentProps {
  searchParams: {
    page?: string;
    limit?: string;
  };
  members: AdminBusinessUserResponse[];
  totalElements: number;
}

export default function BusinessMembersContent({
  searchParams,
  members,
  totalElements,
}: BusinessMembersContentProps) {
  const router = useRouter();
  const { toggle } = useSidebar();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;

  return (
    <>
      <AdminHeader
        title="사업자 멤버 관리"
        onToggleSidebar={toggle}
        showSearch={false}
      />

      <div className="p-8">
        <div className="mb-4">
          <p className="text-sm text-gray-600">총 {totalElements}건</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    ID
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    이름
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    이메일
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    픽업 권한
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      사업자 멤버가 없습니다.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr
                      key={member.userId}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() =>
                        router.push(
                          `/admin/businesses/members/${member.userId}`,
                        )
                      }
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {member.userId}
                      </td>
                      <td className="typo-medium-14 px-4 py-3 text-gray-900">
                        {member.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {member.username ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {member.hasPickupRole ? (
                          <Badge className="bg-amber-100 text-amber-700">
                            픽업 권한 있음
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500">
                            픽업 권한 없음
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/admin/businesses/members/${member.userId}`,
                              )
                            }
                            className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                            title="상세"
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
