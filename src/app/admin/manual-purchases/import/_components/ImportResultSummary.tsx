import type { AdminManualPurchaseImportResponse } from "@/apis/generated/api";

export default function ImportResultSummary({ result }: { result: AdminManualPurchaseImportResponse }) {
  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
        <span>전체 {result.totalRows ?? 0}행</span>
        <span className="text-green-700">성공 {result.successCount ?? 0}행</span>
        <span className="text-red-700">실패 {result.failureCount ?? 0}행</span>
        <span>{result.dryRun ? "검증 결과" : "등록 결과"}</span>
      </div>
      {(result.results ?? []).length > 0 && (
        <div className="mt-3 max-h-72 overflow-auto rounded border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">행</th>
                <th className="px-3 py-2 text-left">사용자ID</th>
                <th className="px-3 py-2 text-left">보틀ID</th>
                <th className="px-3 py-2 text-left">주문번호</th>
                <th className="px-3 py-2 text-left">결과</th>
                <th className="px-3 py-2 text-left">메시지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.results?.map((row) => (
                <tr key={`${row.rowNumber}-${row.userId}-${row.bottleId}`}>
                  <td className="px-3 py-2">{row.rowNumber}</td>
                  <td className="px-3 py-2">{row.userId ?? "-"}</td>
                  <td className="px-3 py-2">{row.bottleId ?? "-"}</td>
                  <td className="px-3 py-2">{row.orderNumber ?? "-"}</td>
                  <td className={row.success ? "px-3 py-2 text-green-700" : "px-3 py-2 text-red-700"}>
                    {row.success ? "성공" : "실패"}
                  </td>
                  <td className="px-3 py-2">{row.message ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
