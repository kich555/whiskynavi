import type { AdminManualPurchaseImportResponse, AdminManualPurchaseImportRowResponse } from "@/apis/generated/api";

export function getFailedImportRows(result: AdminManualPurchaseImportResponse): AdminManualPurchaseImportRowResponse[] {
  return (result.results ?? []).filter((row) => !row.success);
}

export function formatImportFailureRow(row: AdminManualPurchaseImportRowResponse) {
  const rowNumber = row.rowNumber == null ? "행 번호 없음" : `${row.rowNumber}행`;
  const userId = row.userId == null ? "사용자ID 없음" : `사용자ID ${row.userId}`;
  const bottleId = row.bottleId == null ? "보틀ID 없음" : `보틀ID ${row.bottleId}`;
  return `${rowNumber} (${userId}, ${bottleId}): ${row.message ?? "실패 사유 없음"}`;
}

export function formatImportFailureToast(result: AdminManualPurchaseImportResponse) {
  const failedRows = getFailedImportRows(result);
  const shownRows = failedRows.slice(0, 3).map(formatImportFailureRow);
  const remainingCount = Math.max(failedRows.length - shownRows.length, 0);
  const suffix = remainingCount > 0 ? ` 외 ${remainingCount}건` : "";
  return `실패 행: ${shownRows.join(" / ")}${suffix}`;
}
