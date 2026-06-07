"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";

import type { AdminUserResponse } from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { formatDate } from "@/lib/formatters";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";
import { banUserAction, cancelUserBanAction, editUserBanAction } from "../actions";
import DeleteConfirmModal from "./modals/BlacklistDeleteModal";
import BlacklistFormModal from "./modals/BlacklistFormModal";

interface BlacklistContentProps {
  searchParams: {
    page?: string;
    limit?: string;
    q?: string;
  };
  blacklist: AdminUserResponse[];
}

export default function BlacklistContent({ searchParams, blacklist }: BlacklistContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const searchQuery = searchParams.q || "";

  const filteredBlacklist = useMemo(() => {
    return blacklist.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const name = item.name?.toLowerCase() || "";
      const email = item.email?.toLowerCase() || "";
      const reason = item.userExt?.banReason?.toLowerCase() || "";
      return name.includes(searchLower) || email.includes(searchLower) || reason.includes(searchLower);
    });
  }, [blacklist, searchQuery]);

  const paginatedBlacklist = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBlacklist.slice(start, start + itemsPerPage);
  }, [filteredBlacklist, currentPage, itemsPerPage]);

  const openAddModal = () => {
    overlay.open(({ isOpen, close }) => (
      <BlacklistFormModal
        isOpen={isOpen}
        close={close}
        mode="add"
        onSubmit={async (data) => {
          const userId = data.userId;
          if (!userId) return;
          startTransition(async () => {
            const result = await banUserAction(userId, {
              reason: data.reason,
              startAt: data.startAt,
              endAt: data.endAt,
            });
            if (result.success) {
              close();
              router.refresh();
            } else {
              toast.error(result.error);
            }
          });
        }}
      />
    ));
  };

  const openEditModal = (item: AdminUserResponse) => {
    overlay.open(({ isOpen, close }) => (
      <BlacklistFormModal
        isOpen={isOpen}
        close={close}
        mode="edit"
        initialData={{
          userId: item.id!,
          name: item.name!,
          reason: item.userExt?.banReason || "",
          startAt: item.userExt?.banStartDate || "",
          endAt: item.userExt?.banEndDate || "",
        }}
        onSubmit={async (data) => {
          startTransition(async () => {
            const result = await editUserBanAction(item.id!, {
              reason: data.reason,
              startAt: data.startAt,
              endAt: data.endAt,
            });
            if (result.success) {
              close();
              router.refresh();
            } else {
              toast.error(result.error);
            }
          });
        }}
      />
    ));
  };

  const openDeleteModal = (item: AdminUserResponse) => {
    overlay.open(({ isOpen, close }) => (
      <DeleteConfirmModal
        isOpen={isOpen}
        close={close}
        onConfirm={async () => {
          startTransition(async () => {
            const result = await cancelUserBanAction(item.id!);
            if (result.success) {
              close();
              router.refresh();
            } else {
              toast.error(result.error);
            }
          });
        }}
      />
    ));
  };

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
    router.push(`/admin/blacklist?${params.toString()}`);
  };

  const isPermanentBan = (dateString?: string) => {
    if (!dateString) return true;
    const date = new Date(dateString);
    return date.getFullYear() >= 3000;
  };

  return (
    <>
      <AdminHeader title="블랙리스트" onToggleSidebar={toggle} searchQuery={searchQuery} onSearch={handleSearch} />

      <div className="p-8">
        <div className="mb-4 flex justify-end">
          <Button variant="destructive" onClick={openAddModal}>
            <Plus size={16} />
            블랙리스트 추가
          </Button>
        </div>

        <div
          className={`overflow-hidden rounded-lg border border-gray-200 bg-white transition-opacity ${isPending ? "pointer-events-none opacity-60" : ""}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">ID</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">이름</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">이메일</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">사유</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">제재 시작일</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">제재 종료일</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedBlacklist.length === 0 && !isPending ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      블랙리스트가 없습니다.
                    </td>
                  </tr>
                ) : paginatedBlacklist.length === 0 && isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={`skeleton-${i}-${j}`} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  paginatedBlacklist.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.id}</td>
                      <td className="typo-medium-14 px-4 py-3 text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.email}</td>
                      <td className="max-w-[300px] px-4 py-3 text-sm text-gray-600">
                        {item.userExt?.banReason ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block cursor-default truncate">{item.userExt.banReason}</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[400px]">
                                <p className="whitespace-pre-wrap">{item.userExt.banReason}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.userExt?.banStartDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {isPermanentBan(item.userExt?.banEndDate) ? (
                          <Badge variant="destructive">영구</Badge>
                        ) : (
                          formatDate(item.userExt?.banEndDate)
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Button variant="edit" onClick={() => openEditModal(item)} disabled={isPending}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="delete" onClick={() => openDeleteModal(item)} disabled={isPending}>
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
            totalItems={filteredBlacklist.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            searchParams={searchParams}
            basePath="/admin/blacklist"
          />
        </div>
      </div>
    </>
  );
}
