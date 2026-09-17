import { parsePositiveInt } from "@/lib/page-response";
import Link from "next/link";
import GuestNotificationTable from "../_components/GuestNotificationTable";
import { loadGuestNotifications } from "../notification-actions";

export default async function GuestNotificationFailuresPage({
  searchParams,
}: {
  searchParams: Promise<{ beforeId?: string; all?: string }>;
}) {
  const params = await searchParams;
  const failedOnly = params.all !== "true";
  const rows = await loadGuestNotifications(undefined, failedOnly, parsePositiveInt(params.beforeId) ?? undefined);
  return (
    <div className="space-y-5 p-4 sm:p-8">
      <Link href="/admin/general-item-orders" className="typo-medium-14 text-amber-700 underline">
        일반상품 주문 목록
      </Link>
      <h1 className="typo-bold-24">비회원 주문 안내 발송 현황</h1>
      <p className="typo-medium-14 leading-relaxed text-gray-600">
        실패·재시도 중인 안내를 확인하고 주문 상세에서 재발송하거나 조회 코드를 재발급할 수 있습니다. 연락처는 주문에
        등록된 값만 사용합니다.
      </p>
      <div className="typo-medium-14 flex gap-4">
        <Link className={failedOnly ? "font-bold underline" : "text-gray-500"} href="?">
          실패·재시도
        </Link>
        <Link className={!failedOnly ? "font-bold underline" : "text-gray-500"} href="?all=true">
          전체 기록
        </Link>
      </div>
      <section className="rounded-lg border bg-white p-4">
        <GuestNotificationTable rows={rows} />
      </section>
      {rows.length === 50 && (
        <Link
          className="typo-medium-14 inline-block text-amber-700 underline"
          href={`?all=${!failedOnly}&beforeId=${rows.at(-1)?.id}`}
        >
          이전 기록
        </Link>
      )}
    </div>
  );
}
