"use client";

import type { AdminDeliveryCsvUploadResponse, GetApiAdminOrdersDeliveryExportParams } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Download, FileCheck2, Loader2, Truck, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { exportAdminDeliveryWorkbook, uploadAdminDeliveryWorkbook } from "../actions";

const buttonBase =
  "h-11 w-full focus-visible:ring-amber-600/40 disabled:opacity-100 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-600";
const secondaryButton = `${buttonBase} border border-gray-300 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-100`;
const primaryButton = `${buttonBase} bg-amber-700 text-white hover:bg-amber-800`;

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
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingAction, setPendingAction] = useState<"download" | "validate" | "ship" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validatedFile, setValidatedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AdminDeliveryCsvUploadResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [failedOnly, setFailedOnly] = useState(false);
  const canShip = file !== null && file === validatedFile && result?.dryRun === true && (result.successCount ?? 0) > 0;

  const exportWorkbook = () => {
    setPendingAction("download");
    startTransition(async () => {
      const response = await exportAdminDeliveryWorkbook(filters);
      if (!response.success || !response.data) {
        toast.error(response.error ?? "다운로드에 실패했습니다.");
        return;
      }
      downloadWorkbook(response.data, "일반상품-출고작업.xlsx");
    });
  };

  const upload = (dryRun: boolean) => {
    if (!file || (!dryRun && !canShip)) return;
    const currentFile = file;
    setPendingAction(dryRun ? "validate" : "ship");
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
    <section
      className="mb-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-5"
      aria-labelledby="delivery-workbook-title"
    >
      <h2 id="delivery-workbook-title" className="typo-bold-18 text-gray-900">
        엑셀로 일괄 출고
      </h2>
      <p className="typo-medium-14 mt-2 leading-relaxed text-gray-600">
        출고 파일을 내려받고 송장을 작성한 뒤, 검증한 주문을 발송 처리합니다.
      </p>
      <ol className="mt-5 grid gap-3 min-[1200px]:grid-cols-3">
        <li className="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="typo-bold-14 flex items-center gap-2 text-gray-900">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700">
              1
            </span>
            출고 파일 받기
          </h3>
          <p className="typo-medium-13 mt-3 mb-4 leading-relaxed text-gray-600">
            현재 검색 조건의 발송 가능 주문입니다. 집품표·포장명세·CNPLUS 접수용 데이터가 포함됩니다.
          </p>
          <Button className={`${secondaryButton} mt-auto`} onClick={exportWorkbook} disabled={isPending}>
            {isPending && pendingAction === "download" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            {isPending && pendingAction === "download" ? "다운로드 준비 중…" : "출고 엑셀 다운로드"}
          </Button>
        </li>
        <li className="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="typo-bold-14 flex items-center gap-2 text-gray-900">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700">
              2
            </span>
            송장 파일 선택·검증
          </h3>
          <p className="typo-medium-13 mt-3 mb-4 leading-relaxed text-gray-600">
            송장입력 시트의 노란 칸을 작성한 파일을 선택하세요. .xlsx, 최대 8MB
          </p>
          <input
            ref={fileInput}
            type="file"
            aria-label="작성한 출고 엑셀 (.xlsx, 최대 8MB)"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={isPending}
            className="hidden"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setValidatedFile(null);
              setResult(null);
              setFailedOnly(false);
            }}
          />
          <div className="mt-auto grid gap-2 md:grid-cols-2">
            <Button className={secondaryButton} onClick={() => fileInput.current?.click()} disabled={isPending}>
              <Upload className="size-4" aria-hidden="true" />
              {file ? "파일 변경" : "파일 선택"}
            </Button>
            <Button
              className={primaryButton}
              disabled={isPending || !file}
              onClick={() => upload(true)}
              aria-describedby="workbook-file-status"
            >
              {isPending && pendingAction === "validate" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileCheck2 className="size-4" aria-hidden="true" />
              )}
              {isPending && pendingAction === "validate" ? "검증 중…" : "엑셀 검증"}
            </Button>
          </div>
        </li>
        <li className="flex min-w-0 flex-col rounded-lg border border-amber-200 bg-amber-50/50 p-4">
          <h3 className="typo-bold-14 flex items-center gap-2 text-gray-900">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              3
            </span>
            검증한 주문 발송
          </h3>
          <p className="typo-medium-13 mt-3 mb-4 leading-relaxed text-gray-600" id="workbook-shipping-help">
            {canShip
              ? `검증을 통과한 ${result?.successCount}건만 배송 중으로 변경합니다. 오류·건너뜀 주문은 제외합니다.`
              : result?.dryRun === false
                ? "발송 결과를 아래에서 확인하세요. 다시 처리하려면 파일을 재검증하세요."
                : result?.dryRun === true
                  ? "발송 가능한 주문이 없습니다. 아래 검증 결과를 확인하세요."
                  : "파일 검증을 마치면 활성화됩니다. 검증만으로는 발송되지 않습니다."}
          </p>
          <Button
            className={`${primaryButton} mt-auto`}
            disabled={isPending || !canShip}
            onClick={() => upload(false)}
            aria-describedby="workbook-shipping-help"
          >
            {isPending && pendingAction === "ship" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Truck className="size-4" aria-hidden="true" />
            )}
            {isPending && pendingAction === "ship"
              ? "발송 처리 중…"
              : canShip
                ? `발송 가능 ${result?.successCount}건 처리`
                : "검증 후 발송 처리"}
          </Button>
        </li>
      </ol>
      <p
        id="workbook-file-status"
        className="typo-medium-13 mt-3 min-w-0 leading-relaxed break-all text-gray-700"
        role="status"
      >
        {file ? `선택한 파일: ${file.name}` : "선택한 파일이 없습니다. 송장 작성 후 파일을 선택해주세요."}
      </p>
      <p className="typo-medium-12 mt-3 leading-relaxed text-gray-500">
        운송장이 비어 있는 주문과 같은 송장으로 이미 처리된 주문은 건너뜁니다. 주소 변경은 주문 화면에서 처리하고 엑셀을
        다시 내려받아주세요. 주문당 송장 1개를 지원합니다.
      </p>
      <details className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 text-gray-700">
        <summary className="typo-medium-14 cursor-pointer py-4 leading-relaxed focus-visible:outline-2 focus-visible:outline-amber-700">
          CNPLUS로 송장을 출력하는 경우
        </summary>
        <ol className="typo-medium-13 mb-4 list-decimal space-y-2 pl-5 leading-relaxed">
          <li>엑셀 시트 순서대로 집품표 → 포장명세 → CNPLUS 접수용 → 송장입력을 진행하세요.</li>
          <li>
            CNPLUS 접수용 시트를 새 엑셀에 값으로 복사하고 고객 LAYOUT을 연결하세요. 열 순서와 설정 방법은 파일 마지막의
            CNPLUS 안내 시트에 있습니다.
          </li>
          <li>우편번호·박스수량·운임구분·박스타입의 빈칸은 실제 배송지와 CJ 계약에 맞춰 확인하세요.</li>
          <li>
            발급된 송장을 고객주문번호로 대조해 원본 송장입력 시트에 텍스트로 입력한 뒤 이 화면에서 검증하세요. CNPLUS
            결과 파일을 직접 업로드하는 기능은 아직 지원하지 않습니다.
          </li>
        </ol>
      </details>
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
                className={`${secondaryButton} sm:w-auto`}
                onClick={() => downloadWorkbook(result.workbookBase64!, "일반상품-출고결과.xlsx")}
              >
                <Download className="size-4" aria-hidden="true" />
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
