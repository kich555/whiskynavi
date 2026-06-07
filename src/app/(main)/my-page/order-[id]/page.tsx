import { getApiOrdersOrderid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions, getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { parsePositiveInt } from "@/lib/page-response";
import { notFound, redirect } from "next/navigation";
import OrderDetailClient from "./_components/OrderDetailClient";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/sign-in?callbackUrl=/my-page");
  }

  const token = await getAuthToken();
  const { id } = await params;
  const orderId = parsePositiveInt(id);
  if (!orderId) notFound();

  const result = await getApiOrdersOrderid(orderId, withToken(token)).catch(() => null);

  if (!result?.data) {
    notFound();
  }

  return <OrderDetailClient order={result.data} />;
}
