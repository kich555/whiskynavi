import type { AdminServiceEntitlementSearchResponse } from "@/apis/generated/api";
import Link from "next/link";
import ServiceEntitlementUseForm from "../general-item-orders/_components/ServiceEntitlementUseForm";
import { entitlementSearchHref, entitlementStatusLabels, type EntitlementSearchParams } from "./filters";
import RefreshEntitlementsButton from "./RefreshEntitlementsButton";

type Result = { success: true; data: AdminServiceEntitlementSearchResponse } | { success: false; error: string };
const formatDate = (value?: string) => value?.replace("T", " ") ?? "-";
const statusStyles: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-800",
  USED: "bg-blue-50 text-blue-800",
  CANCELED: "bg-red-50 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-700",
  NOT_YET_VALID: "bg-amber-50 text-amber-800",
  SUSPENDED: "bg-red-50 text-red-800",
};
export default function ServiceEntitlementsContent({
  params,
  result,
}: {
  params: EntitlementSearchParams;
  result: Result;
}) {
  const rows = result.success ? (result.data.items ?? []) : [];
  return (
    <div className="space-y-6 p-4 text-gray-900 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="typo-bold-24">이용권 관리</h1>
          <p className="typo-medium-14 mt-3 leading-6 text-gray-600">
            발급된 이용권을 검색하고 실제 이용을 확인해 사용 완료 처리합니다.
          </p>
        </div>
        <div className="typo-medium-14 flex flex-wrap gap-4 text-amber-700">
          <Link href="/admin/general-item-sales/new" className="underline">
            판매공고 등록
          </Link>
          <Link href="/admin/general-item-orders?fulfillmentMethod=SERVICE" className="underline">
            이용권 주문 목록
          </Link>
        </div>
      </header>
      <form
        key={JSON.stringify(params)}
        action="/admin/service-entitlements"
        method="get"
        className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <label className="typo-medium-14 space-y-2 md:col-span-2">
          <span>상품명 · 주문번호 · 구매자 · 연락처</span>
          <input
            name="keyword"
            defaultValue={params.keyword}
            maxLength={100}
            placeholder="검색어 입력"
            className="block w-full rounded border border-gray-300 p-3"
          />
        </label>
        <label className="typo-medium-14 space-y-2">
          <span>이용권 상태</span>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="block w-full rounded border border-gray-300 bg-white p-3"
          >
            <option value="">전체 상태</option>
            {Object.entries(entitlementStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="typo-medium-14 space-y-2">
          <span>이용권 번호</span>
          <input
            name="entitlementId"
            type="number"
            min="1"
            step="1"
            defaultValue={params.entitlementId}
            className="block w-full rounded border border-gray-300 p-3"
          />
        </label>
        <label className="typo-medium-14 space-y-2">
          <span>주문 ID</span>
          <input
            name="orderId"
            type="number"
            min="1"
            step="1"
            defaultValue={params.orderId}
            className="block w-full rounded border border-gray-300 p-3"
          />
        </label>
        <div className="flex flex-wrap items-end gap-3 md:col-span-2 lg:col-span-3">
          <button className="typo-bold-14 rounded bg-gray-900 px-6 py-3 text-white">검색</button>
          <Link href="/admin/service-entitlements" className="typo-medium-14 rounded border border-gray-300 px-4 py-3">
            초기화
          </Link>
          <RefreshEntitlementsButton />
        </div>
      </form>
      <p className="typo-medium-14 rounded-lg bg-amber-50 p-4 leading-6 text-amber-900">
        관리자는 이용 시작 전·만료 후에도 사유를 남겨 처리할 수 있습니다. 사용 완료는 되돌릴 수 없으며, 사용한 이용권이
        포함된 주문은 전체 취소할 수 없습니다. 취소·이용 정지·이미 사용한 이용권은 처리할 수 없습니다.
      </p>
      {!result.success ? (
        <p role="alert" className="typo-medium-16 rounded border border-red-200 bg-red-50 p-5 leading-6 text-red-800">
          {result.error}
        </p>
      ) : (
        <>
          <p className="typo-medium-14 text-gray-600">이번 목록 {rows.length}건 · 최신 발급 순 · 한 번에 최대 50건</p>
          {rows.length === 0 ? (
            <p className="typo-medium-16 rounded-lg border border-gray-200 bg-white p-8 text-center leading-6">
              조건에 맞는 이용권이 없습니다. 검색 조건을 변경해 주세요.
            </p>
          ) : (
            <ul className="space-y-4" aria-label="관리자 이용권 목록">
              {rows.map((row) => (
                <li key={row.id} className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="typo-bold-18 leading-6 break-words">
                      {row.itemName} · {row.unitNumber}번
                    </h2>
                    <span
                      className={`typo-bold-14 rounded px-3 py-2 ${statusStyles[row.status ?? ""] ?? "bg-gray-100"}`}
                    >
                      {entitlementStatusLabels[row.status ?? ""] ?? "상태 확인 필요"}
                    </span>
                  </div>
                  <dl className="typo-medium-14 mt-4 grid gap-4 leading-6 md:grid-cols-3">
                    <div>
                      <dt className="text-gray-500">이용권 / 주문</dt>
                      <dd>
                        이용권 #{row.id}
                        <br />
                        <Link
                          href={`/admin/general-item-orders/${row.orderId}`}
                          className="break-all text-amber-700 underline"
                        >
                          {row.orderNumber ?? `주문 #${row.orderId}`}
                        </Link>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">구매자 ({row.userId == null ? "비회원" : "회원"})</dt>
                      <dd className="break-words">
                        {row.customerName ?? "이름 미등록"}
                        <br />
                        {row.customerPhone ?? "연락처 미등록"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">이용 기간 (한국 시간)</dt>
                      <dd>
                        {row.validFrom ? formatDate(row.validFrom) : "발급 즉시"}
                        <br />~ {formatDate(row.validUntil)}
                      </dd>
                    </div>
                  </dl>
                  <p className="typo-medium-13 mt-4 leading-6 text-gray-500">발급: {formatDate(row.issuedAt)}</p>
                  {row.usedAt && (
                    <details className="typo-medium-14 mt-3 rounded bg-gray-50 p-3 leading-6">
                      <summary className="cursor-pointer">사용 기록 · {formatDate(row.usedAt)}</summary>
                      <p className="mt-2">처리자: {row.usedBy == null ? "비회원 본인" : `사용자 #${row.usedBy}`}</p>
                      <p className="break-words whitespace-pre-wrap">사유: {row.useReason ?? "-"}</p>
                    </details>
                  )}
                  {["AVAILABLE", "NOT_YET_VALID", "EXPIRED"].includes(row.status ?? "") &&
                    row.orderId != null &&
                    row.id != null && (
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <ServiceEntitlementUseForm orderId={row.orderId} entitlementId={row.id} />
                      </div>
                    )}
                </li>
              ))}
            </ul>
          )}
          <nav aria-label="이용권 페이지" className="typo-medium-14 flex flex-wrap justify-between gap-4">
            {params.beforeId ? (
              <Link href={entitlementSearchHref(params)} className="rounded border border-gray-300 bg-white px-4 py-3">
                처음 목록
              </Link>
            ) : (
              <span />
            )}
            {result.data.hasMore && result.data.nextBeforeId != null && (
              <Link
                href={entitlementSearchHref(params, result.data.nextBeforeId)}
                className="rounded border border-gray-300 bg-white px-4 py-3"
              >
                다음 50건
              </Link>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
