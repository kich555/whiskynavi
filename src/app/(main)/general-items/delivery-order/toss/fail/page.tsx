import { parsePositiveInt } from "@/lib/page-response";
import Link from "next/link";
import { redirect } from "next/navigation";
export default async function DirectPaymentFail({
  searchParams,
}: {
  searchParams: Promise<{ saleId?: string; quantity?: string; message?: string; code?: string }>;
}) {
  const p = await searchParams;
  const saleId = parsePositiveInt(p.saleId),
    quantity = parsePositiveInt(p.quantity);
  if (!saleId || !quantity)
    redirect(
      `/general-items/cart/order/toss/fail?${new URLSearchParams({ message: p.message ?? "결제가 취소되었습니다.", code: p.code ?? "" })}`,
    );
  return (
    <main className="min-h-screen bg-[#1d2429] px-4 pt-28 text-white">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="typo-bold-24">결제를 완료하지 못했습니다.</h1>
        <p>{p.message ?? "결제가 취소되었거나 인증에 실패했습니다."}</p>
        <Link className="block underline" href={`/general-items/delivery-order?saleId=${saleId}&quantity=${quantity}`}>
          같은 상품으로 다시 주문
        </Link>
        <Link className="block underline" href={`/general-items/${saleId}`}>
          상품으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
