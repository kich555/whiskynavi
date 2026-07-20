"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import OrderCompletionPanel from "../../../../delivery-order/_components/OrderCompletionPanel";
import { confirmGeneralItemCartTossPayment } from "../../actions";

interface TossSuccessClientProps {
  orderId?: string;
  paymentKey?: string;
  amount?: string;
}

type ConfirmResult = Awaited<ReturnType<typeof confirmGeneralItemCartTossPayment>>;

export default function TossSuccessClient({ orderId, paymentKey, amount }: TossSuccessClientProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const autoConfirmStartedRef = useRef(false);

  const confirm = () => {
    startTransition(async () => {
      setResult(await confirmGeneralItemCartTossPayment({ orderId, paymentKey, amount }));
    });
  };

  useEffect(() => {
    if (autoConfirmStartedRef.current) return;
    autoConfirmStartedRef.current = true;
    confirm();
    // Toss redirect params are fixed for this page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-24 pb-10 md:pt-28 md:pb-16">
      {isPending && (
        <div role="status" className="border border-white/10 bg-white/5 p-8 text-center text-white">
          결제를 확정하는 중입니다.
        </div>
      )}

      {!isPending && result?.success && result.data && <OrderCompletionPanel result={result.data} />}

      {!isPending && result && !result.success && (
        <div role="alert" className="border border-red-400/30 bg-red-400/10 p-6">
          <h1 className="typo-bold-24 text-white">결제 확정에 실패했습니다.</h1>
          <p className="typo-medium-14 mt-3 text-red-100">{result.error}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={confirm} disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
              같은 결제 정보로 다시 확정
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/general-items/cart/order">주문서로 돌아가기</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
