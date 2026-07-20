"use client";

import type { AdminUserResponse } from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/formatters";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";
import { releasePostCreationRestrictionAction } from "../actions";
import PostRestrictionFormModal from "./PostRestrictionFormModal";

interface PostRestrictionsContentProps {
  restrictions: AdminUserResponse[];
  now: string;
  totalElements: number;
  currentPage: number;
  itemsPerPage: number;
  searchParams: { page?: string; limit?: string };
}

export default function PostRestrictionsContent({
  restrictions,
  now,
  totalElements,
  currentPage,
  itemsPerPage,
  searchParams,
}: PostRestrictionsContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeRestrictions = useMemo(() => {
    const currentTime = new Date(now).getTime();
    return restrictions.filter((user) => {
      const ext = user.userExt;
      if (!ext?.isPostCreationRestricted || !ext.postCreationRestrictionStartAt || !ext.postCreationRestrictionEndAt) {
        return false;
      }
      return new Date(ext.postCreationRestrictionEndAt).getTime() > currentTime;
    });
  }, [now, restrictions]);

  const openForm = (user?: AdminUserResponse) => {
    overlay.open(({ isOpen, close }) => (
      <PostRestrictionFormModal isOpen={isOpen} close={close} user={user} onSaved={() => router.refresh()} />
    ));
  };

  const releaseRestriction = (user: AdminUserResponse) => {
    if (
      !user.id ||
      !window.confirm(`${user.name ?? user.email ?? `ID ${user.id}`} 사용자의 제한을 해제하시겠습니까?`)
    ) {
      return;
    }
    startTransition(async () => {
      const result = await releasePostCreationRestrictionAction(user.id!);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("게시글 작성 제한을 해제했습니다.");
      router.refresh();
    });
  };

  return (
    <>
      <AdminHeader title="게시글 작성 제한" onToggleSidebar={toggle} />
      <div className="p-4 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="typo-medium-14 text-gray-500">계정 밴과 별개로 게시글 생성만 제한합니다.</p>
          <Button onClick={() => openForm()}>
            <Plus size={16} />
            제한 추가
          </Button>
        </div>

        <div className={`overflow-hidden rounded-lg border border-gray-200 bg-white ${isPending ? "opacity-60" : ""}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">사용자</th>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">사유</th>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">시작 시각</th>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">종료 시각</th>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">상태</th>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeRestrictions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center typo-medium-14 text-gray-500">
                      활성 게시글 작성 제한이 없습니다.
                    </td>
                  </tr>
                ) : (
                  activeRestrictions.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="typo-medium-14 text-gray-900">{user.name ?? "-"}</p>
                        <p className="typo-medium-12 text-gray-500">{user.email ?? `ID ${user.id}`}</p>
                      </td>
                      <td className="max-w-[320px] px-4 py-3 typo-medium-14 text-gray-600">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block cursor-default truncate">
                                {user.userExt?.postCreationRestrictionReason ?? "-"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[400px] whitespace-pre-wrap">
                              {user.userExt?.postCreationRestrictionReason ?? "-"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="px-4 py-3 typo-medium-14 text-gray-600">
                        {formatDateTime(user.userExt?.postCreationRestrictionStartAt)}
                      </td>
                      <td className="px-4 py-3 typo-medium-14 text-gray-600">
                        {formatDateTime(user.userExt?.postCreationRestrictionEndAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {new Date(user.userExt!.postCreationRestrictionStartAt!).getTime() > new Date(now).getTime()
                            ? "예약"
                            : "제한 중"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="edit"
                            onClick={() => openForm(user)}
                            disabled={isPending}
                            aria-label="제한 수정"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="delete"
                            onClick={() => releaseRestriction(user)}
                            disabled={isPending}
                            aria-label="제한 해제"
                          >
                            <Trash2 size={16} />
                          </Button>
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
            basePath="/admin/post-restrictions"
          />
        </div>
      </div>
    </>
  );
}
