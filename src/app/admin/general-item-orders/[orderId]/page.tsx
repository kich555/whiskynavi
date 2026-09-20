import { getApiAdminOrdersOrderid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/page-response";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminOrderDetailContent from "../../orders/_components/AdminOrderDetailContent";
import GuestNotificationPanel from "../_components/GuestNotificationPanel";
import ServiceEntitlementAdminPanel from "../_components/ServiceEntitlementAdminPanel";
import { loadAdminEntitlements } from "../entitlement-actions";
import { loadGuestNotificationHistory, loadGuestNotifications } from "../notification-actions";

interface AdminGeneralItemOrderDetailPageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ notificationBeforeId?: string; historyBeforeId?: string }>;
}

export default async function AdminGeneralItemOrderDetailPage({
  params,
  searchParams,
}: AdminGeneralItemOrderDetailPageProps) {
  const { orderId } = await params;
  const id = parsePositiveInt(orderId);
  if (!id) notFound();

  const token = await getAuthToken();
  let response;

  try {
    response = await getApiAdminOrdersOrderid(id, withToken(token));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[404]")) {
      notFound();
    }
    throw error;
  }

  const order = response.data;
  const guestGeneralOrder =
    !order.userId &&
    order.productType === "ITEM" &&
    (order.fulfillmentMethod === "DIRECT_DELIVERY" || order.fulfillmentMethod === "SERVICE") &&
    order.saleTiming === "IMMEDIATE";
  let guestNotificationSection;
  if (guestGeneralOrder) {
    const query = await searchParams;
    const [rows, history] = await Promise.all([
      loadGuestNotifications(id, false, parsePositiveInt(query.notificationBeforeId) ?? undefined),
      loadGuestNotificationHistory(id, parsePositiveInt(query.historyBeforeId) ?? undefined),
    ]);
    guestNotificationSection = <GuestNotificationPanel orderId={id} rows={rows} history={history} />;
  }
  const entitlementSection =
    order.fulfillmentMethod === "SERVICE" ? (
      <ServiceEntitlementAdminPanel orderId={id} rows={await loadAdminEntitlements(id)} />
    ) : undefined;
  return (
    <AdminOrderDetailContent
      order={order}
      guestNotificationSection={
        <>
          {order.fulfillmentMethod === "DIRECT_DELIVERY" && (
            <Link
              className="typo-medium-14 block rounded-lg border bg-white p-4 text-amber-700 underline"
              href={`/admin/general-item-orders/shipment-notifications?orderId=${id}`}
            >
              출고 알림 발송 현황·재발송
            </Link>
          )}
          {guestNotificationSection}
        </>
      }
      entitlementSection={entitlementSection}
    />
  );
}
