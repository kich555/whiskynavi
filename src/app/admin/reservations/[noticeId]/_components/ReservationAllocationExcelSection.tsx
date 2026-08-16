"use client";

import type {
  ReservationAllocationExcelFailureResponse,
  ReservationAllocationExcelResponse,
} from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Download, FileSpreadsheet, FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadReservationAllocationExcelAction } from "../../actions";

interface ReservationAllocationExcelSectionProps {
  noticeId: number;
}

export default function ReservationAllocationExcelSection({ noticeId }: ReservationAllocationExcelSectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ReservationAllocationExcelResponse | null>(null);
  const [failures, setFailures] = useState<ReservationAllocationExcelFailureResponse[]>([]);
  const [includeAdminManualOrdersInSeriesScore, setIncludeAdminManualOrdersInSeriesScore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const downloadHref = includeAdminManualOrdersInSeriesScore
    ? `/api/admin/reservations/${noticeId}/allocation-excel?includeAdminManualOrdersInSeriesScore=true`
    : `/api/admin/reservations/${noticeId}/allocation-excel`;

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Excel 파일을 선택해주세요.");
      return;
    }

    startTransition(async () => {
      const response = await uploadReservationAllocationExcelAction(noticeId, file);
      if (response.success) {
        setResult(response.data);
        setFailures(response.data.failures ?? []);
        toast.success("Excel 할당 업로드를 완료했습니다.");
        router.refresh();
        return;
      }

      setResult(null);
      setFailures(response.failures ?? []);
      toast.error(response.error);
    });
  };

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild variant="outline" size="sm">
              <a href={downloadHref}>
                <Download className="size-4" />
                할당용 Excel 다운로드
              </a>
            </Button>
            <label className="typo-medium-14 flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-gray-700 xl:w-[360px]">
              <FileSpreadsheet className="size-4 shrink-0 text-gray-400" />
              <span className="sr-only">예약 할당 Excel 파일</span>
              <Input ref={fileInputRef} type="file" accept=".xlsx" className="h-auto border-0 px-0 shadow-none" />
            </label>
          </div>
          <Button type="button" size="sm" onClick={handleUpload} disabled={isPending}>
            <FileUp className="size-4" />
            Excel 할당 업로드
          </Button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
          <div className="space-y-1">
            <label htmlFor="admin-manual-orders-in-allocation-excel" className="typo-medium-14 text-gray-900">
              관리자 수동 등록 주문 포함
            </label>
            <p className="typo-regular-12 text-gray-500">
              Excel의 시리즈 구매 보틀 종류 수에 관리자 수동 등록 주문을 포함합니다.
            </p>
          </div>
          <Switch
            id="admin-manual-orders-in-allocation-excel"
            checked={includeAdminManualOrdersInSeriesScore}
            onCheckedChange={setIncludeAdminManualOrdersInSeriesScore}
            aria-label="Excel 시리즈 가산점에 관리자 수동 등록 주문 포함"
          />
        </div>
        <p className="typo-medium-12 mt-2 text-gray-500">배정수량 0은 신청 거절로 처리됩니다.</p>

        {result && (
          <div className="typo-medium-14 mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-200 pt-3 text-gray-700">
            <span className="font-semibold text-gray-900">총 할당 수량 {result.totalAllocatedQuantity ?? 0}</span>
            <span>할당 신청 {result.allocatedApplicationCount ?? 0}건</span>
            <span>거절 신청 {result.rejectedApplicationCount ?? 0}건</span>
            <span>처리 행 {result.processedRowCount ?? 0}건</span>
            <span>잔여 수량 {result.remainingQuantityAfterAllocation ?? 0}</span>
          </div>
        )}

        {failures.length > 0 && (
          <div className="mt-3 overflow-x-auto border-t border-gray-200 pt-3">
            <table className="typo-medium-14 w-full min-w-[520px]">
              <thead>
                <tr className="typo-semibold-12 text-left text-gray-500 uppercase">
                  <th className="w-20 py-1 pr-3">행</th>
                  <th className="w-28 py-1 pr-3">신청 ID</th>
                  <th className="py-1 pr-3">사유</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {failures.map((failure, index) => (
                  <tr key={`${failure.rowNumber ?? "row"}-${failure.applicationId ?? "app"}-${index}`}>
                    <td className="py-2 pr-3 text-gray-900">{failure.rowNumber ?? "-"}</td>
                    <td className="py-2 pr-3 text-gray-900">{failure.applicationId ?? "-"}</td>
                    <td className="py-2 pr-3 text-gray-700">{failure.reason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
