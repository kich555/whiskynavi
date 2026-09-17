import { getApiAdminOrdersOrderid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/page-response";
import { notFound } from "next/navigation";
import AdminOrderDetailContent from "../../orders/_components/AdminOrderDetailContent";
import GuestNotificationPanel from "../_components/GuestNotificationPanel";
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
    order.fulfillmentMethod === "DIRECT_DELIVERY" &&
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
  return <AdminOrderDetailContent order={order} guestNotificationSection={guestNotificationSection} />;
}
