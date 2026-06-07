import { getApiAdminOrdersOrderid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/page-response";
import { notFound } from "next/navigation";
import AdminOrderDetailContent from "../../orders/_components/AdminOrderDetailContent";

interface AdminGeneralItemOrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function AdminGeneralItemOrderDetailPage({ params }: AdminGeneralItemOrderDetailPageProps) {
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

  return <AdminOrderDetailContent order={response.data} />;
}
