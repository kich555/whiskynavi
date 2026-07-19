import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TossFailPageProps {
  searchParams: Promise<{
    code?: string;
    message?: string;
    orderId?: string;
  }>;
}

export default async function TossFailPage({ searchParams }: TossFailPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#1d2429] px-4 py-10 text-white md:py-16">
      <section className="mx-auto max-w-2xl border border-red-400/30 bg-red-400/10 p-6">
        <p className="typo-medium-14 text-red-200">{params.code ?? "PAYMENT_FAILED"}</p>
        <h1 className="typo-bold-24 mt-2">토스 결제가 완료되지 않았습니다.</h1>
        <p className="typo-medium-14 mt-4 leading-6 text-red-100">
          {params.message ?? "결제가 취소되었거나 인증에 실패했습니다. 주문서를 다시 확인해 주세요."}
        </p>
        {params.orderId && (
          <p className="typo-medium-12 mt-3 font-mono text-red-100/70">PG 주문 ID: {params.orderId}</p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="bg-amber-600 hover:bg-amber-700">
            <Link href="/general-items/cart/order">주문 다시 시도</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/general-items/cart">장바구니로 돌아가기</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
