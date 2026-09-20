import { parsePositiveInt } from "@/lib/page-response";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShipmentNotificationPanel from "../_components/ShipmentNotificationPanel";
import ShipmentNotificationTable from "../_components/ShipmentNotificationTable";
import { loadShipmentNotificationHistory, loadShipmentNotifications } from "../shipment-notification-actions";

export default async function ShipmentNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    beforeId?: string;
    all?: string;
    notificationBeforeId?: string;
    historyBeforeId?: string;
  }>;
}) {
  const params = await searchParams;
  const orderId = parsePositiveInt(params.orderId) ?? undefined;
  if (params.orderId !== undefined && !orderId) notFound();
  const failedOnly = params.all !== "true";
  const [rows, history] = await Promise.all([
    loadShipmentNotifications(
      orderId,
      orderId ? false : failedOnly,
      parsePositiveInt(orderId ? params.notificationBeforeId : params.beforeId) ?? undefined,
    ),
    orderId
      ? loadShipmentNotificationHistory(orderId, parsePositiveInt(params.historyBeforeId) ?? undefined)
      : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-5 p-4 md:p-8">
      <Link href="/admin/general-item-orders" className="typo-medium-14 text-amber-700 underline">
        일반상품 주문 목록
      </Link>
      <h1 className="typo-bold-24">출고 알림 발송 현황{orderId ? ` · 주문 #${orderId}` : ""}</h1>
      {orderId ? (
        <>
          <div className="typo-medium-14 flex flex-wrap gap-4">
            <Link href="/admin/general-item-orders/shipment-notifications" className="underline">
              전체 실패 목록
            </Link>
            <Link href={`/admin/general-item-orders/${orderId}`} className="underline">
              주문 상세
            </Link>
          </div>
          <ShipmentNotificationPanel orderId={orderId} rows={rows} history={history} />
        </>
      ) : (
        <>
          <p className="typo-medium-14 leading-relaxed text-gray-600">
            실패·재시도 중인 출고 안내를 확인하세요. 주문 번호를 선택하면 처리 이력과 재발송 기능을 사용할 수 있습니다.
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
            <ShipmentNotificationTable rows={rows} />
          </section>
          {rows.length === 50 && (
            <Link
              className="typo-medium-14 inline-block text-amber-700 underline"
              href={`?all=${!failedOnly}&beforeId=${rows.at(-1)?.id}`}
            >
              이전 기록
            </Link>
          )}
        </>
      )}
    </div>
  );
}
