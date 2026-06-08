import type {
  UserBottleReservationPickupMonthlyNoticeStatisticsResponse,
  UserBottleReservationPickupMonthlyStatisticsResponse,
  UserBottleReservationPickupMonthlyStatusStatisticsResponse,
} from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import BusinessHeader from "../../_components/BusinessHeader";
import { PICKUP_STATUS_COLOR, PICKUP_STATUS_LABEL } from "../../constants";
import { formatCurrency } from "../../utils";

interface BusinessStatisticsContentProps {
  statistics: UserBottleReservationPickupMonthlyStatisticsResponse;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

const parseRequiredMonth = (month?: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(month ?? "");
  if (!match) {
    throw new Error("월간 통계 응답에 조회 월이 없습니다.");
  }
  const [, year, monthValue] = match;
  return { value: match[0], year: Number(year), month: Number(monthValue) };
};

const formatMonthLabel = (month: string) => {
  const parsed = parseRequiredMonth(month);
  return `${parsed.year}년 ${String(parsed.month).padStart(2, "0")}월`;
};

const shiftMonth = (month: string, offset: number) => {
  const parsed = parseRequiredMonth(month);
  const date = new Date(parsed.year, parsed.month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const formatCount = (value?: number) => `${numberFormatter.format(value ?? 0)}건`;
const formatBottleCount = (value?: number) => `${numberFormatter.format(value ?? 0)}병`;

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="border border-gray-200 bg-white p-4">
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </div>
  );
}

function StatusTable({ statuses }: { statuses?: UserBottleReservationPickupMonthlyStatusStatisticsResponse[] }) {
  const rows = statuses ?? [];

  return (
    <div className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900">상태별 현황</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">상태</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">신청</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">요청</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">확정</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.status}>
                <td className="px-4 py-3 text-sm">
                  <Badge className={PICKUP_STATUS_COLOR[row.status ?? ""] ?? "bg-gray-100 text-gray-700"}>
                    {PICKUP_STATUS_LABEL[row.status ?? ""] ?? row.status ?? "-"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCount(row.applicationCount)}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">
                  {formatBottleCount(row.requestedQuantity)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">
                  {formatBottleCount(row.confirmedQuantity)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(row.salesAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NoticeTable({ notices }: { notices?: UserBottleReservationPickupMonthlyNoticeStatisticsResponse[] }) {
  return (
    <div className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900">최근 공고별 현황</h3>
      </div>
      {(notices ?? []).length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-gray-500">해당 월 예약 통계가 없습니다.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">공고</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">신청</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">요청</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">확정</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(notices ?? []).map((notice) => (
                <tr key={notice.noticeId ?? notice.bottleName}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-bold text-gray-900">{notice.bottleName ?? "이름 없는 공고"}</div>
                    <div className="mt-1 text-xs text-gray-500">공고 #{notice.noticeId ?? "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCount(notice.applicationCount)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {formatBottleCount(notice.requestedQuantity)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {formatBottleCount(notice.confirmedQuantity)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(notice.salesAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function BusinessStatisticsContent({ statistics }: BusinessStatisticsContentProps) {
  const { value: month } = parseRequiredMonth(statistics.month);
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  return (
    <>
      <BusinessHeader title="월간 예약 통계" />

      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-gray-500">{statistics.businessName ?? "사업장"}</p>
            <h3 className="mt-1 text-xl font-bold text-gray-900">{formatMonthLabel(month)}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/business/statistics?month=${previousMonth}`}>
                <ChevronLeft size={16} />
                전월
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/business/statistics?month=${nextMonth}`}>
                다음월
                <ChevronRight size={16} />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="신청 건수" value={formatCount(statistics.totalApplicationCount)} helper="월 전체 신청" />
          <StatCard label="신청 수량" value={formatBottleCount(statistics.totalRequestedQuantity)} helper="요청 병 수" />
          <StatCard label="확정 수량" value={formatBottleCount(statistics.totalConfirmedQuantity)} helper="승인 병 수" />
          <StatCard label="수령완료 금액" value={formatCurrency(statistics.receivedSalesAmount)} helper="완료 기준" />
          <StatCard label="신청 금액" value={formatCurrency(statistics.totalSalesAmount)} helper="전체 신청 기준" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <StatusTable statuses={statistics.statuses} />
          <NoticeTable notices={statistics.recentNotices} />
        </div>
      </div>
    </>
  );
}
