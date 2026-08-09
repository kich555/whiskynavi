import type {
  AdminBottleManualPurchaseV2Response,
  AdminBottleReservationNoticeV2Response,
  AdminBottleReservationV2Response,
} from "@/apis/generated/api";
import Pagination from "@/app/admin/_components/Pagination";
import { createSearchParams, type AdminSearchParams, type AdminSearchParamValue } from "@/app/admin/_lib/searchParams";
import { ORDER_STATUS_LABEL, RESERVATION_STATUS_COLOR, RESERVATION_STATUS_LABEL } from "@/app/admin/constants";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import Link from "next/link";
import ManualPurchaseOrdersSection from "./ManualPurchaseOrdersSection";

const SALE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "작성 중",
  OPEN: "진행 중",
  CLOSED: "마감",
  SOLD_OUT: "품절",
};

const SALE_STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-200 text-gray-700",
  SOLD_OUT: "bg-red-100 text-red-700",
};

const NOTICE_STATUS_OPTIONS = [
  { value: "", label: "전체 공고 상태" },
  ...Object.entries(SALE_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const RESERVATION_STATUS_OPTIONS = [
  { value: "", label: "전체 예약 상태" },
  ...Object.entries(RESERVATION_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const MANUAL_STATUS_OPTIONS = [
  { value: "", label: "전체 주문 상태" },
  ...Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const NOTICE_SORT_OPTIONS = [
  { value: "RESERVATION_START_AT", label: "예약 시작일" },
  { value: "CREATED_AT", label: "등록일" },
  { value: "PRICE", label: "가격" },
  { value: "TOTAL_QUANTITY", label: "전체 수량" },
  { value: "NOTICE_NAME", label: "공고명" },
];

const RESERVATION_SORT_OPTIONS = [
  { value: "CREATED_AT", label: "신청일" },
  { value: "TOTAL_PRICE", label: "총액" },
  { value: "QUANTITY", label: "신청 수량" },
  { value: "CONFIRMED_QUANTITY", label: "확정 수량" },
  { value: "APPLICANT_NAME", label: "신청자명" },
];

const MANUAL_SORT_OPTIONS = [
  { value: "CREATED_AT", label: "주문일" },
  { value: "TOTAL_PRICE", label: "총액" },
  { value: "QUANTITY", label: "수량" },
  { value: "MEMBER_NAME", label: "구매자명" },
  { value: "ORDER_NUMBER", label: "주문번호" },
  { value: "ORDER_STATUS", label: "주문 상태" },
];

interface RelatedBottleManagementSectionsProps {
  bottleId: number;
  searchParams: AdminSearchParams;
  reservationNotices: AdminBottleReservationNoticeV2Response[];
  reservationNoticeCount: number;
  reservationNoticePage: number;
  reservationNoticeLimit: number;
  reservations: AdminBottleReservationV2Response[];
  reservationCount: number;
  reservationPage: number;
  reservationLimit: number;
  manualPurchases: AdminBottleManualPurchaseV2Response[];
  manualPurchaseCount: number;
  manualPurchasePage: number;
  manualPurchaseLimit: number;
}

function single(value: AdminSearchParamValue): string {
  const normalized = Array.isArray(value) ? value[0] : value;
  return normalized ?? "";
}

interface RelationFilterFormProps {
  bottleId: number;
  searchParams: AdminSearchParams;
  hash: string;
  pageKey: string;
  keywordKey: string;
  statusKey: string;
  sortByKey: string;
  sortDirectionKey: string;
  createdAtFromKey: string;
  createdAtToKey: string;
  keywordPlaceholder: string;
  statusOptions: { value: string; label: string }[];
  sortOptions: { value: string; label: string }[];
  defaultSortBy: string;
  noticeIdKey?: string;
}

function RelationFilterForm({
  bottleId,
  searchParams,
  hash,
  pageKey,
  keywordKey,
  statusKey,
  sortByKey,
  sortDirectionKey,
  createdAtFromKey,
  createdAtToKey,
  keywordPlaceholder,
  statusOptions,
  sortOptions,
  defaultSortBy,
  noticeIdKey,
}: RelationFilterFormProps) {
  const filterKeys = [
    keywordKey,
    statusKey,
    sortByKey,
    sortDirectionKey,
    createdAtFromKey,
    createdAtToKey,
    ...(noticeIdKey ? [noticeIdKey] : []),
  ];
  const excludedKeys = new Set([pageKey, ...filterKeys]);
  const resetParams = createSearchParams(searchParams);
  excludedKeys.forEach((key) => resetParams.delete(key));
  const resetQuery = resetParams.toString();
  const resetHref = `/admin/products/${bottleId}${resetQuery ? `?${resetQuery}` : ""}#${hash}`;

  return (
    <form
      action={`/admin/products/${bottleId}#${hash}`}
      method="get"
      className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4"
    >
      {Object.entries(searchParams).flatMap(([key, value]) => {
        if (excludedKeys.has(key) || value === undefined) return [];
        const values = Array.isArray(value) ? value : [value];
        return values.map((item) => <input key={`${key}-${item}`} type="hidden" name={key} value={item} />);
      })}
      <input type="hidden" name={pageKey} value="1" />
      <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_180px_180px_180px_auto]">
        <input
          type="search"
          name={keywordKey}
          defaultValue={single(searchParams[keywordKey])}
          placeholder={keywordPlaceholder}
          className="typo-medium-14 h-10 rounded-lg border border-gray-300 bg-white px-3 outline-none focus:border-amber-500"
        />
        <select
          name={statusKey}
          defaultValue={single(searchParams[statusKey])}
          aria-label="상태 필터"
          className="typo-medium-14 h-10 rounded-lg border border-gray-300 bg-white px-3 outline-none focus:border-amber-500"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {noticeIdKey ? (
          <input
            type="number"
            min="1"
            name={noticeIdKey}
            defaultValue={single(searchParams[noticeIdKey])}
            placeholder="공고 ID"
            className="typo-medium-14 h-10 rounded-lg border border-gray-300 bg-white px-3 outline-none focus:border-amber-500"
          />
        ) : (
          <input
            type="datetime-local"
            name={createdAtFromKey}
            defaultValue={single(searchParams[createdAtFromKey])}
            aria-label="등록 시작일시"
            className="typo-medium-14 h-10 rounded-lg border border-gray-300 bg-white px-3 outline-none focus:border-amber-500"
          />
        )}
        {noticeIdKey ? (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="datetime-local"
              name={createdAtFromKey}
              defaultValue={single(searchParams[createdAtFromKey])}
              aria-label="등록 시작일시"
              className="typo-medium-12 h-10 min-w-0 rounded-lg border border-gray-300 bg-white px-2 outline-none focus:border-amber-500"
            />
            <input
              type="datetime-local"
              name={createdAtToKey}
              defaultValue={single(searchParams[createdAtToKey])}
              aria-label="등록 종료일시"
              className="typo-medium-12 h-10 min-w-0 rounded-lg border border-gray-300 bg-white px-2 outline-none focus:border-amber-500"
            />
          </div>
        ) : (
          <input
            type="datetime-local"
            name={createdAtToKey}
            defaultValue={single(searchParams[createdAtToKey])}
            aria-label="등록 종료일시"
            className="typo-medium-14 h-10 rounded-lg border border-gray-300 bg-white px-3 outline-none focus:border-amber-500"
          />
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            className="typo-bold-14 h-10 rounded-lg bg-amber-600 px-4 text-white hover:bg-amber-700"
          >
            조회
          </button>
          <Link
            href={resetHref}
            className="typo-bold-14 flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-gray-700 hover:bg-gray-100"
          >
            초기화
          </Link>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <span className="typo-bold-12 text-gray-600">정렬</span>
        <select
          name={sortByKey}
          defaultValue={single(searchParams[sortByKey]) || defaultSortBy}
          aria-label="정렬 기준"
          className="typo-medium-14 h-10 rounded-lg border border-gray-300 bg-white px-3 outline-none focus:border-amber-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name={sortDirectionKey}
          defaultValue={single(searchParams[sortDirectionKey]) || "DESC"}
          aria-label="정렬 방향"
          className="typo-medium-14 h-10 rounded-lg border border-gray-300 bg-white px-3 outline-none focus:border-amber-500"
        >
          <option value="DESC">내림차순</option>
          <option value="ASC">오름차순</option>
        </select>
      </div>
    </form>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h2 className="typo-bold-20 text-gray-900">{title}</h2>
      <span className="typo-medium-12 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
        {count.toLocaleString("ko-KR")}건
      </span>
    </div>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="typo-medium-14 px-4 py-10 text-center text-gray-500">
        {message}
      </td>
    </tr>
  );
}

export default function RelatedBottleManagementSections({
  bottleId,
  searchParams,
  reservationNotices,
  reservationNoticeCount,
  reservationNoticePage,
  reservationNoticeLimit,
  reservations,
  reservationCount,
  reservationPage,
  reservationLimit,
  manualPurchases,
  manualPurchaseCount,
  manualPurchasePage,
  manualPurchaseLimit,
}: RelatedBottleManagementSectionsProps) {
  const basePath = `/admin/products/${bottleId}`;
  return (
    <div className="mt-10 space-y-10">
      <section aria-labelledby="reservation-notices-heading">
        <div id="reservation-notices-heading">
          <SectionHeader title="관련 예약 공고" count={reservationNoticeCount} />
        </div>
        <RelationFilterForm
          bottleId={bottleId}
          searchParams={searchParams}
          hash="reservation-notices-heading"
          pageKey="noticePage"
          keywordKey="noticeKeyword"
          statusKey="noticeStatus"
          sortByKey="noticeSortBy"
          sortDirectionKey="noticeSortDirection"
          createdAtFromKey="noticeCreatedAtFrom"
          createdAtToKey="noticeCreatedAtTo"
          keywordPlaceholder="공고명 검색"
          statusOptions={NOTICE_STATUS_OPTIONS}
          sortOptions={NOTICE_SORT_OPTIONS}
          defaultSortBy="RESERVATION_START_AT"
        />
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[960px] border-collapse">
            <thead className="bg-gray-50">
              <tr className="typo-bold-12 text-left text-gray-600">
                <th className="px-4 py-3">공고명</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3 text-right">가격</th>
                <th className="px-4 py-3 text-right">신청 / 승인 / 전체</th>
                <th className="px-4 py-3">예약 기간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservationNotices.length === 0 ? (
                <EmptyRow colSpan={5} message="이 보틀과 관련된 예약 공고가 없습니다." />
              ) : (
                reservationNotices.map((notice) => (
                  <tr key={notice.id} className="typo-medium-14 text-gray-700">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/reservations/${notice.id}`}
                        className="font-semibold text-amber-700 hover:underline"
                      >
                        {notice.noticeName ?? `공고 #${notice.id}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`typo-bold-12 inline-flex rounded-full px-2.5 py-1 ${
                          SALE_STATUS_COLOR[notice.saleStatus ?? ""] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {SALE_STATUS_LABEL[notice.saleStatus ?? ""] ?? notice.saleStatus ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(notice.price)}</td>
                    <td className="px-4 py-3 text-right">
                      {(notice.appliedQuantity ?? 0).toLocaleString("ko-KR")} /{" "}
                      {(notice.approvedQuantity ?? 0).toLocaleString("ko-KR")} /{" "}
                      {(notice.totalQuantity ?? 0).toLocaleString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDateTime(notice.reservationStartAt)} ~ {formatDateTime(notice.reservationEndAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalItems={reservationNoticeCount}
          itemsPerPage={reservationNoticeLimit}
          currentPage={reservationNoticePage}
          searchParams={searchParams}
          basePath={basePath}
          pageParam="noticePage"
          limitParam="noticeLimit"
          hash="reservation-notices-heading"
          alwaysVisible
        />
      </section>

      <section aria-labelledby="reservations-heading">
        <div id="reservations-heading">
          <SectionHeader title="관련 예약 건" count={reservationCount} />
        </div>
        <RelationFilterForm
          bottleId={bottleId}
          searchParams={searchParams}
          hash="reservations-heading"
          pageKey="reservationPage"
          keywordKey="reservationKeyword"
          statusKey="reservationStatus"
          sortByKey="reservationSortBy"
          sortDirectionKey="reservationSortDirection"
          createdAtFromKey="reservationCreatedAtFrom"
          createdAtToKey="reservationCreatedAtTo"
          keywordPlaceholder="주문번호·공고·신청자·사업장 검색"
          statusOptions={RESERVATION_STATUS_OPTIONS}
          sortOptions={RESERVATION_SORT_OPTIONS}
          defaultSortBy="CREATED_AT"
          noticeIdKey="reservationNoticeId"
        />
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[1080px] border-collapse">
            <thead className="bg-gray-50">
              <tr className="typo-bold-12 text-left text-gray-600">
                <th className="px-4 py-3">신청 번호</th>
                <th className="px-4 py-3">예약 공고</th>
                <th className="px-4 py-3">신청자</th>
                <th className="px-4 py-3">신청 사업장</th>
                <th className="px-4 py-3">픽업 사업장</th>
                <th className="px-4 py-3 text-right">신청 / 확정</th>
                <th className="px-4 py-3 text-right">총액</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">신청일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.length === 0 ? (
                <EmptyRow colSpan={9} message="이 보틀과 관련된 예약 건이 없습니다." />
              ) : (
                reservations.map((reservation) => (
                  <tr key={reservation.id} className="typo-medium-14 text-gray-700">
                    <td className="px-4 py-3">#{reservation.id}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/reservations/${reservation.noticeId}`}
                        className="font-semibold text-amber-700 hover:underline"
                      >
                        {reservation.noticeName ?? `공고 #${reservation.noticeId}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>{reservation.applicantName ?? "-"}</div>
                      <div className="typo-medium-12 mt-1 text-gray-500">{reservation.applicantPhone ?? "-"}</div>
                    </td>
                    <td className="px-4 py-3">{reservation.applicantBusinessName ?? "-"}</td>
                    <td className="px-4 py-3">{reservation.pickupBusinessName ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      {(reservation.quantity ?? 0).toLocaleString("ko-KR")} /{" "}
                      {(reservation.confirmedQuantity ?? 0).toLocaleString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(reservation.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`typo-bold-12 inline-flex rounded-full px-2.5 py-1 ${
                          RESERVATION_STATUS_COLOR[reservation.status ?? ""] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {RESERVATION_STATUS_LABEL[reservation.status ?? ""] ?? reservation.status ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(reservation.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalItems={reservationCount}
          itemsPerPage={reservationLimit}
          currentPage={reservationPage}
          searchParams={searchParams}
          basePath={basePath}
          pageParam="reservationPage"
          limitParam="reservationLimit"
          hash="reservations-heading"
          alwaysVisible
        />
      </section>

      <section aria-labelledby="manual-purchases-heading">
        <div id="manual-purchases-heading">
          <SectionHeader title="관리자 수동 구매내역" count={manualPurchaseCount} />
        </div>
        <RelationFilterForm
          bottleId={bottleId}
          searchParams={searchParams}
          hash="manual-purchases-heading"
          pageKey="manualPage"
          keywordKey="manualKeyword"
          statusKey="manualStatus"
          sortByKey="manualSortBy"
          sortDirectionKey="manualSortDirection"
          createdAtFromKey="manualCreatedAtFrom"
          createdAtToKey="manualCreatedAtTo"
          keywordPlaceholder="주문번호·구매자·연락처·메모 검색"
          statusOptions={MANUAL_STATUS_OPTIONS}
          sortOptions={MANUAL_SORT_OPTIONS}
          defaultSortBy="CREATED_AT"
        />
        <ManualPurchaseOrdersSection bottleId={bottleId} purchases={manualPurchases} />
        <Pagination
          totalItems={manualPurchaseCount}
          itemsPerPage={manualPurchaseLimit}
          currentPage={manualPurchasePage}
          searchParams={searchParams}
          basePath={basePath}
          pageParam="manualPage"
          limitParam="manualLimit"
          hash="manual-purchases-heading"
          alwaysVisible
        />
      </section>
    </div>
  );
}
