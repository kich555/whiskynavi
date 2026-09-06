"use client";

import type { AdminBottleSeriesResponse } from "@/apis/generated/api";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import Pagination from "@/app/admin/_components/Pagination";
import { createSearchParams } from "@/app/admin/_lib/searchParams";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/formatters";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BottleSeriesSearchParams } from "../page";
import BottleSeriesDeleteDialog from "./BottleSeriesDeleteDialog";
import BottleSeriesFormDialog from "./BottleSeriesFormDialog";

interface BottleSeriesContentProps {
  searchParams: BottleSeriesSearchParams;
  series: AdminBottleSeriesResponse[];
  totalElements: number;
}

export default function BottleSeriesContent({ searchParams, series, totalElements }: BottleSeriesContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [formTarget, setFormTarget] = useState<AdminBottleSeriesResponse | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<AdminBottleSeriesResponse | null>(null);

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const searchQuery = searchParams.q || "";
  const visibility = searchParams.visible === "true" || searchParams.visible === "false" ? searchParams.visible : "all";

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = createSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/admin/bottle-series?${params.toString()}`);
  };

  return (
    <>
      <AdminHeader
        title="보틀 시리즈 관리"
        onToggleSidebar={toggle}
        searchQuery={searchQuery}
        onSearch={(value) => updateParams({ q: value || undefined, page: "1" })}
      />

      <div className="p-4 sm:p-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="typo-medium-14 text-gray-600">총 {totalElements.toLocaleString("ko-KR")}건</p>
            <Select
              value={visibility}
              onValueChange={(value) => updateParams({ visible: value === "all" ? undefined : value, page: "1" })}
            >
              <SelectTrigger aria-label="노출 여부 필터" className="w-32 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="true">노출</SelectItem>
                <SelectItem value="false">숨김</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setFormTarget(null)}>
            <Plus size={16} />
            시리즈 등록
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">ID</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">이미지</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">브랜드 / 시리즈</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">대표 보틀 ID</th>
                  <th className="typo-bold-12 px-4 py-3 text-center text-gray-700 uppercase">노출</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">수정일</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {series.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="typo-medium-14 px-4 py-12 text-center text-gray-500">
                      조건에 맞는 보틀 시리즈가 없습니다.
                    </td>
                  </tr>
                ) : (
                  series.map((item) => (
                    <tr key={item.id ?? `${item.brand}-${item.series}`} className="transition-colors hover:bg-gray-50">
                      <td className="typo-medium-14 px-4 py-3 text-gray-900">{item.id ?? "-"}</td>
                      <td className="px-4 py-3">
                        <div className="relative size-14 overflow-hidden rounded-md bg-gray-100">
                          <ImageWithFallback
                            src={item.imageUrl}
                            alt={`${item.brand ?? ""} ${item.series ?? ""}`.trim()}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="typo-medium-14 text-gray-900">{item.brand ?? "-"}</p>
                        <p className="typo-medium-12 mt-1 text-gray-500">{item.series ?? "-"}</p>
                        {item.description ? (
                          <p className="typo-medium-12 mt-1 max-w-[320px] truncate text-gray-400">{item.description}</p>
                        ) : null}
                      </td>
                      <td className="typo-medium-14 px-4 py-3 text-gray-600">{item.representativeBottleId ?? "-"}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`typo-medium-12 inline-flex rounded-full px-2.5 py-1 ${
                            item.visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.visible ? "노출" : "숨김"}
                        </span>
                      </td>
                      <td className="typo-medium-14 px-4 py-3 whitespace-nowrap text-gray-600">
                        {formatDate(item.updatedAt ?? item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="edit"
                            aria-label={`${item.brand ?? ""} ${item.series ?? ""} 수정`.trim()}
                            onClick={() => setFormTarget(item)}
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            type="button"
                            variant="delete"
                            aria-label={`${item.brand ?? ""} ${item.series ?? ""} 삭제`.trim()}
                            onClick={() => setDeleteTarget(item)}
                            disabled={item.id == null}
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
            basePath="/admin/bottle-series"
          />
        </div>
      </div>

      {formTarget !== undefined ? (
        <BottleSeriesFormDialog
          key={formTarget?.id ?? "new"}
          open
          series={formTarget}
          onOpenChange={(open) => {
            if (!open) setFormTarget(undefined);
          }}
        />
      ) : null}

      {deleteTarget ? (
        <BottleSeriesDeleteDialog
          open
          series={deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        />
      ) : null}
    </>
  );
}
