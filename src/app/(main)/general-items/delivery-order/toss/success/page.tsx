import { redirect } from "next/navigation";
import TossSuccessClient from "../../../cart/order/toss/success/TossSuccessClient";

interface LegacyTossSuccessPageProps {
  searchParams: Promise<{
    purchase?: string;
    orderId?: string;
    paymentKey?: string;
    amount?: string;
  }>;
}

export default async function LegacyTossSuccessPage({ searchParams }: LegacyTossSuccessPageProps) {
  const params = await searchParams;
  if (params.purchase === "direct")
    return (
      <main className="min-h-screen bg-[#1d2429]">
        <TossSuccessClient {...params} purchase="direct" />
      </main>
    );
  const query = new URLSearchParams();

  if (params.orderId) query.set("orderId", params.orderId);
  if (params.paymentKey) query.set("paymentKey", params.paymentKey);
  if (params.amount) query.set("amount", params.amount);

  redirect(`/general-items/cart/order/toss/success${query.size ? `?${query.toString()}` : ""}`);
}
