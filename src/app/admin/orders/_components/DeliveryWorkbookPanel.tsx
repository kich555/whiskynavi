"use client";

import type { AdminDeliveryCsvUploadResponse, GetApiAdminOrdersDeliveryExportParams } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { exportAdminDeliveryWorkbook, uploadAdminDeliveryWorkbook } from "../actions";

type Filters = Pick<
  GetApiAdminOrdersDeliveryExportParams,
  "keyword" | "orderStatus" | "paymentMethod" | "paymentStatus" | "guestOnly"
>;

function downloadWorkbook(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DeliveryWorkbookPanel({ filters }: { filters: Filters }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [validatedFile, setValidatedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AdminDeliveryCsvUploadResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [failedOnly, setFailedOnly] = useState(false);
  const canShip = file !== null && file === validatedFile && result?.dryRun === true && (result.successCount ?? 0) > 0;

  const exportWorkbook = () =>
    startTransition(async () => {
      const response = await exportAdminDeliveryWorkbook(filters);
      if (!response.success || !response.data) {
        toast.error(response.error ?? "다운로드에 실패했습니다.");
        return;
      }
      downloadWorkbook(response.data, "일반상품-출고작업.xlsx");
    });

  const upload = (dryRun: boolean) => {
    if (!file || (!dryRun && !canShip)) return;
    const currentFile = file;
    startTransition(async () => {
      // 실패/타임아웃으로 결과를 확인하지 못해도 재검증한 뒤 안전하게 재시도한다.
      setValidatedFile(null);
      const response = await uploadAdminDeliveryWorkbook(currentFile, dryRun);
      if (!response.success || !response.data) {
        toast.error(response.error ?? "업로드에 실패했습니다.");
        return;
      }
      setResult(response.data);
      if (dryRun) setValidatedFile(currentFile);
      else router.refresh();
      toast.success(
        dryRun
          ? "엑셀 검증을 마쳤습니다. 주문별 결과를 확인해주세요."
          : "발송 처리를 마쳤습니다. 실패·건너뜀 주문을 확인해주세요.",
      );
    });
  };

  const rows = (result?.results ?? []).filter((row) => !failedOnly || (!row.success && !row.skipped));
  return (
    <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5" aria-labelledby="delivery-workbook-title">
      <h2 id="delivery-workbook-title" className="typo-bold-18 text-gray-900">
        엑셀로 일괄 출고
      </h2>
      <p className="typo-medium-14 mt-3 leading-relaxed text-gray-600">
        현재 검색 조건의 발송 가능 주문을 내려받습니다. 송장입력은 주문당 한 줄, 포장명세는 상품당 한 줄로 표시하며
        상품별 집품표도 제공합니다.
      </p>
      <ol className="typo-medium-14 my-4 grid list-inside list-decimal gap-3 text-gray-700 md:grid-cols-3">
        <li>엑셀 다운로드 후 상품·수량 확인</li>
        <li>송장입력 시트의 노란 칸 작성</li>
        <li>업로드 검증 후 발송 가능 건 처리</li>
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={exportWorkbook} disabled={isPending}>
          출고 엑셀 다운로드
        </Button>
        <label className="typo-medium-14 flex min-w-0 flex-col gap-2 text-gray-700">
          작성한 출고 엑셀 (.xlsx, 최대 8MB)
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={isPending}
            className="max-w-full"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setValidatedFile(null);
              setResult(null);
              setFailedOnly(false);
            }}
          />
        </label>
        <Button variant="outline" disabled={isPending || !file} onClick={() => upload(true)}>
          엑셀 검증
        </Button>
        <Button disabled={isPending || !canShip} onClick={() => upload(false)}>
          {isPending ? "처리 중…" : canShip ? `발송 가능 ${result?.successCount}건 처리` : "검증 후 발송 처리"}
        </Button>
      </div>
      <p className="typo-medium-12 mt-3 leading-relaxed text-gray-500">
        운송장이 비어 있는 주문과 같은 송장으로 이미 처리된 주문은 건너뜁니다. 주소 변경은 주문 화면에서 처리하고 엑셀을
        다시 내려받아주세요. 주문당 송장 1개를 지원합니다.
      </p>
      {result && (
        <div className="mt-5 space-y-3" aria-live="polite">
          <div className="typo-medium-14 flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 p-4">
            <strong>{result.dryRun ? "검증 결과" : "발송 결과"}</strong>
            <span>전체 {result.totalRows ?? 0}건</span>
            <span className="text-green-700">
              {result.dryRun ? "발송 가능" : "발송 완료"} {result.successCount ?? 0}건
            </span>
            <span className="text-red-700">오류 {result.failureCount ?? 0}건</span>
            <span>건너뜀 {result.skippedCount ?? 0}건</span>
            {result.workbookBase64 && (
              <Button
                variant="outline"
                onClick={() => downloadWorkbook(result.workbookBase64!, "일반상품-출고결과.xlsx")}
              >
                결과 엑셀 다운로드
              </Button>
            )}
          </div>
          <label className="typo-medium-14 flex items-center gap-2">
            <input type="checkbox" checked={failedOnly} onChange={(event) => setFailedOnly(event.target.checked)} />
            오류 주문만 보기
          </label>
          <div className="max-h-80 overflow-auto rounded-lg border border-gray-200">
            <table className="typo-medium-14 w-full min-w-[520px] text-left">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="p-3">엑셀 행</th>
                  <th className="p-3">주문번호</th>
                  <th className="p-3">결과</th>
                  <th className="p-3">안내</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.orderNumber}`} className="border-t border-gray-100">
                    <td className="p-3">{row.rowNumber}</td>
                    <td className="p-3 whitespace-nowrap">{row.orderNumber}</td>
                    <td className="p-3 whitespace-nowrap">
                      {row.skipped ? "건너뜀" : row.success ? (result.dryRun ? "발송 가능" : "발송 완료") : "오류"}
                    </td>
                    <td className="p-3 leading-relaxed break-words">{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
