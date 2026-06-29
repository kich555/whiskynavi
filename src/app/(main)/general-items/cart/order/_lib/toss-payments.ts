import type { UserOrderTicketResponse } from "@/apis/generated/api";
import type { GeneralItemCartDeliveryOrderInput } from "../actions";

const TOSS_SCRIPT_SRC = "https://js.tosspayments.com/v2/standard";

type TossPaymentInstance = {
  requestPayment: (params: {
    method: "CARD";
    amount: { currency: "KRW"; value: number };
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
    customerEmail?: string;
    customerName?: string;
    customerMobilePhone?: string;
  }) => Promise<void>;
};

export type TossPaymentsFactory = ((clientKey: string) => {
  payment: (params: { customerKey: string }) => TossPaymentInstance;
}) & {
  ANONYMOUS: string;
};

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

let tossScriptPromise: Promise<TossPaymentsFactory> | null = null;

export function loadTossPaymentsScript(): Promise<TossPaymentsFactory> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 토스 결제를 시작할 수 있습니다."));
  }

  if (window.TossPayments) {
    return Promise.resolve(window.TossPayments);
  }

  if (tossScriptPromise) return tossScriptPromise;

  tossScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TOSS_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.TossPayments) {
        resolve(window.TossPayments);
      } else {
        tossScriptPromise = null;
        reject(new Error("토스 결제 SDK를 불러오지 못했습니다."));
      }
    };
    script.onerror = () => {
      tossScriptPromise = null;
      reject(new Error("토스 결제 SDK를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });

  return tossScriptPromise;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function requestTossPayment(
  ticket: UserOrderTicketResponse,
  input: GeneralItemCartDeliveryOrderInput,
) {
  if (!ticket.clientKey || !ticket.pgOrderId || !ticket.amount || !ticket.successUrl || !ticket.failUrl) {
    throw new Error("토스 결제 티켓 정보가 올바르지 않습니다. 다시 시도해 주세요.");
  }

  const tossPayments = await loadTossPaymentsScript();
  const payment = tossPayments(ticket.clientKey).payment({
    customerKey: tossPayments.ANONYMOUS,
  });

  await payment.requestPayment({
    method: "CARD",
    amount: {
      currency: "KRW",
      value: ticket.amount,
    },
    orderId: ticket.pgOrderId,
    orderName: ticket.orderName ?? "WhiskyNavi 장바구니 상품",
    successUrl: ticket.successUrl,
    failUrl: ticket.failUrl,
    customerEmail: input.guestEmail,
    customerName: input.receiverName,
    customerMobilePhone: normalizePhone(input.receiverPhone),
  });
}
