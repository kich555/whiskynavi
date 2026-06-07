"use client";

import type {
  CartQuoteResponse,
  UserDeliveryAddressResponse,
  UserOrderTicketResponse,
  UserSelfResponse,
} from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { createDeliveryAddress } from "../../delivery-order/actions";
import { formatCartCurrency, getValidCartItems } from "../_lib/cart-utils";
import { createGeneralItemCartTossTicket, type GeneralItemCartDeliveryOrderInput } from "./actions";

const TOSS_SCRIPT_SRC = "https://js.tosspayments.com/v2/standard";
const KAKAO_POSTCODE_SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

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

type TossPaymentsFactory = ((clientKey: string) => {
  payment: (params: { customerKey: string }) => TossPaymentInstance;
}) & {
  ANONYMOUS: string;
};

type KakaoPostcodeData = {
  zonecode?: string;
  address?: string;
  roadAddress?: string;
  jibunAddress?: string;
  userSelectedType?: "R" | "J";
  bname?: string;
  buildingName?: string;
  apartment?: string;
};

type KakaoPostcodeConstructor = new (params: { oncomplete: (data: KakaoPostcodeData) => void }) => {
  open: () => void;
};

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
    daum?: {
      Postcode?: KakaoPostcodeConstructor;
    };
  }
}

let tossScriptPromise: Promise<TossPaymentsFactory> | null = null;
let kakaoPostcodeScriptPromise: Promise<KakaoPostcodeConstructor> | null = null;

interface CartDeliveryOrderClientProps {
  quote: CartQuoteResponse;
  currentUser?: UserSelfResponse | null;
  deliveryAddresses?: UserDeliveryAddressResponse[];
}

type AddressFormState = {
  addressName: string;
  receiverName: string;
  receiverPhone: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  deliveryMemo: string;
  defaultAddress: boolean;
};

type OrderFormState = {
  receiverName: string;
  receiverPhone: string;
  deliveryPostalCode: string;
  deliveryBaseAddress: string;
  deliveryAddressDetail: string;
  deliveryMemo: string;
  orderNote: string;
  guestEmail: string;
};

function createAttemptKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTossPaymentsScript(): Promise<TossPaymentsFactory> {
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

function loadKakaoPostcodeScript(): Promise<KakaoPostcodeConstructor> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 주소 검색을 사용할 수 있습니다."));
  }

  if (window.daum?.Postcode) {
    return Promise.resolve(window.daum.Postcode);
  }

  if (kakaoPostcodeScriptPromise) return kakaoPostcodeScriptPromise;

  kakaoPostcodeScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = KAKAO_POSTCODE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.daum?.Postcode) {
        resolve(window.daum.Postcode);
      } else {
        kakaoPostcodeScriptPromise = null;
        reject(new Error("주소 검색 서비스를 불러오지 못했습니다."));
      }
    };
    script.onerror = () => {
      kakaoPostcodeScriptPromise = null;
      reject(new Error("주소 검색 서비스를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });

  return kakaoPostcodeScriptPromise;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function createAddressFormState(user?: UserSelfResponse | null): AddressFormState {
  return {
    addressName: "",
    receiverName: user?.name ?? "",
    receiverPhone: user?.phone ?? "",
    postalCode: "",
    address: "",
    addressDetail: "",
    deliveryMemo: "",
    defaultAddress: true,
  };
}

function formatDeliveryAddress(address: UserDeliveryAddressResponse) {
  const streetAddress = [address.address, address.addressDetail].filter(Boolean).join(" ");
  return [address.postalCode ? `(${address.postalCode})` : "", streetAddress].filter(Boolean).join(" ");
}

function getDefaultAddress(addresses: UserDeliveryAddressResponse[]) {
  return addresses.find((address) => address.defaultAddress) ?? null;
}

function resolvePostcodeAddress(data: KakaoPostcodeData) {
  const baseAddress =
    data.address ||
    (data.userSelectedType === "J" ? data.jibunAddress || data.roadAddress : data.roadAddress || data.jibunAddress) ||
    "";

  if (data.userSelectedType !== "R") return baseAddress;

  const extraAddressParts = [
    data.bname && /[동로가]$/u.test(data.bname) ? data.bname : "",
    data.buildingName && data.apartment === "Y" ? data.buildingName : "",
  ].filter(Boolean);

  return [baseAddress, extraAddressParts.length > 0 ? `(${extraAddressParts.join(", ")})` : ""]
    .filter(Boolean)
    .join(" ");
}

function formatOrderDeliveryAddress(
  form: Pick<OrderFormState, "deliveryPostalCode" | "deliveryBaseAddress" | "deliveryAddressDetail">,
) {
  const baseAddress = [form.deliveryPostalCode ? `(${form.deliveryPostalCode})` : "", form.deliveryBaseAddress.trim()]
    .filter(Boolean)
    .join(" ");
  return [baseAddress, form.deliveryAddressDetail.trim()].filter(Boolean).join(" ");
}

function RequiredMark() {
  return (
    <span className="ml-1 text-amber-300" aria-label="필수">
      *
    </span>
  );
}

async function requestTossPayment(ticket: UserOrderTicketResponse, input: GeneralItemCartDeliveryOrderInput) {
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

export default function CartDeliveryOrderClient({
  quote,
  currentUser,
  deliveryAddresses = [],
}: CartDeliveryOrderClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddressPending, startAddressTransition] = useTransition();
  const [attemptKey, setAttemptKey] = useState("");
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSameAsOrderer, setIsSameAsOrderer] = useState(false);
  const [addresses, setAddresses] = useState(deliveryAddresses);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormState>(() => createAddressFormState(currentUser));
  const orderAddressDetailInputRef = useRef<HTMLInputElement>(null);
  const addressBookDetailInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<OrderFormState>({
    receiverName: "",
    receiverPhone: "",
    deliveryPostalCode: "",
    deliveryBaseAddress: "",
    deliveryAddressDetail: "",
    deliveryMemo: "",
    orderNote: "",
    guestEmail: currentUser?.email ?? "",
  });
  const hasOrdererInfo = Boolean(currentUser);
  const hasAddresses = addresses.length > 0;
  const items = getValidCartItems(quote);

  const ensureAttemptKey = () => {
    if (attemptKey) return attemptKey;
    const nextKey = createAttemptKey();
    setAttemptKey(nextKey);
    return nextKey;
  };

  const updateField = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const updateAddressField =
    (field: keyof AddressFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "defaultAddress" && event.target instanceof HTMLInputElement
          ? event.target.checked
          : event.target.value;
      setAddressForm((current) => ({ ...current, [field]: value }));
    };

  const openPostcodeSearch = async (onComplete: (data: KakaoPostcodeData) => void) => {
    const Postcode = await loadKakaoPostcodeScript();
    new Postcode({ oncomplete: onComplete }).open();
  };

  const handleOrderPostcodeSearch = () => {
    setError(null);
    openPostcodeSearch((data) => {
      setForm((current) => ({
        ...current,
        deliveryPostalCode: data.zonecode ?? "",
        deliveryBaseAddress: resolvePostcodeAddress(data),
      }));
      orderAddressDetailInputRef.current?.focus();
    }).catch((postcodeError) => {
      setError(postcodeError instanceof Error ? postcodeError.message : "주소 검색 서비스를 불러오지 못했습니다.");
    });
  };

  const handleAddressFormPostcodeSearch = () => {
    setAddressError(null);
    openPostcodeSearch((data) => {
      setAddressForm((current) => ({
        ...current,
        postalCode: data.zonecode ?? "",
        address: resolvePostcodeAddress(data),
      }));
      addressBookDetailInputRef.current?.focus();
    }).catch((postcodeError) => {
      setAddressError(
        postcodeError instanceof Error ? postcodeError.message : "주소 검색 서비스를 불러오지 못했습니다.",
      );
    });
  };

  const applyAddress = (address: UserDeliveryAddressResponse) => {
    setForm((current) => ({
      ...current,
      receiverName: address.receiverName || current.receiverName,
      receiverPhone: address.receiverPhone || current.receiverPhone,
      deliveryPostalCode: address.postalCode || current.deliveryPostalCode,
      deliveryBaseAddress: address.address || current.deliveryBaseAddress,
      deliveryAddressDetail: address.addressDetail || current.deliveryAddressDetail,
      deliveryMemo: address.deliveryMemo ?? current.deliveryMemo,
    }));
  };

  const applyOrdererInfo = (address?: UserDeliveryAddressResponse | null) => {
    setForm((current) => ({
      ...current,
      receiverName: currentUser?.name || current.receiverName,
      receiverPhone: currentUser?.phone || current.receiverPhone,
      guestEmail: currentUser?.email || current.guestEmail,
      ...(address
        ? {
            deliveryPostalCode: address.postalCode || current.deliveryPostalCode,
            deliveryBaseAddress: address.address || current.deliveryBaseAddress,
            deliveryAddressDetail: address.addressDetail || current.deliveryAddressDetail,
            deliveryMemo: address.deliveryMemo ?? current.deliveryMemo,
          }
        : {}),
    }));
  };

  const handleSameAsOrdererChange = (checked: boolean | "indeterminate") => {
    const nextChecked = checked === true;
    setIsSameAsOrderer(nextChecked);

    if (!nextChecked || !currentUser) return;

    const defaultAddress = getDefaultAddress(addresses);
    applyOrdererInfo(defaultAddress);

    if (!defaultAddress) {
      setAddressForm(createAddressFormState(currentUser));
      setAddressError(null);
      setIsAddressDialogOpen(true);
    }
  };

  const handleAddressSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const addressId = Number(event.target.value);
    const selectedAddress = addresses.find((address) => address.id === addressId);
    if (selectedAddress) applyAddress(selectedAddress);
  };

  const handleAddressDialogOpenChange = (open: boolean) => {
    setIsAddressDialogOpen(open);
    if (open) {
      setAddressError(null);
      setAddressForm(createAddressFormState(currentUser));
    }
  };

  const handleCreateAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddressError(null);

    startAddressTransition(async () => {
      const result = await createDeliveryAddress(addressForm);

      if (!result.success || !result.data) {
        setAddressError(result.error ?? "배송지 저장에 실패했습니다.");
        return;
      }

      setAddresses((current) => {
        const next = result.data?.defaultAddress
          ? current.map((address) => ({ ...address, defaultAddress: false }))
          : current;
        return [...next, result.data!];
      });
      applyAddress(result.data);
      setIsAddressDialogOpen(false);
      setAddressForm(createAddressFormState(currentUser));
    });
  };

  const buildInput = (): GeneralItemCartDeliveryOrderInput => ({
    receiverName: form.receiverName,
    receiverPhone: form.receiverPhone,
    deliveryAddress: formatOrderDeliveryAddress(form),
    deliveryMemo: form.deliveryMemo,
    orderNote: form.orderNote,
    guestEmail: form.guestEmail,
  });

  const handleTossPayment = () => {
    const input = buildInput();
    const idempotencyKey = ensureAttemptKey();
    setError(null);
    setIsPaymentPending(true);

    startTransition(async () => {
      try {
        const result = await createGeneralItemCartTossTicket(input, idempotencyKey);

        if (!result.success) {
          setError(result.error ?? "토스 결제 준비에 실패했습니다.");
          return;
        }

        await requestTossPayment(result.data?.ticket ?? {}, input);
      } catch (paymentError) {
        setError(paymentError instanceof Error ? paymentError.message : "토스 결제를 시작하지 못했습니다.");
      } finally {
        setIsPaymentPending(false);
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <div className="border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-amber-300">GENERAL / ITEM 장바구니 배송 주문</p>
          <h1 className="typo-bold-24 mt-2 text-white md:text-3xl">장바구니에 담긴 상품이 없습니다.</h1>
          <p className="mt-4 text-sm text-gray-400">주문할 상품을 장바구니에 담은 뒤 다시 진행해 주세요.</p>
          <Button asChild className="mt-6 bg-amber-600 hover:bg-amber-700">
            <Link href="/general-items/cart">장바구니로 이동</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_360px] md:py-16">
        <form className="border border-white/10 bg-white/5 p-5 md:p-8" onSubmit={(event) => event.preventDefault()}>
          <div className="mb-8">
            <Button
              onClick={() => router.back()}
              className="mb-3 inline-flex items-center gap-2 bg-transparent text-sm font-medium text-white/70 transition-colors hover:text-white has-[>svg]:px-0"
            >
              <ArrowLeft size={18} />
              뒤로가기
            </Button>
            <p className="text-sm text-amber-300">GENERAL / ITEM 장바구니 배송 주문</p>
            <h1 className="typo-bold-24 mt-2 text-white md:text-3xl">장바구니 배송 주문서</h1>
          </div>

          <div className="grid gap-5">
            {hasOrdererInfo && (
              <div className="flex items-center gap-2 border border-white/10 bg-black/10 p-3">
                <Checkbox
                  id="sameAsOrderer"
                  checked={isSameAsOrderer}
                  onCheckedChange={handleSameAsOrdererChange}
                  className="border-white/40 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-600"
                />
                <label htmlFor="sameAsOrderer" className="text-sm font-medium text-gray-200">
                  주문자와 같음
                </label>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="receiverName">
                  수령인
                  <RequiredMark />
                </label>
                <Input
                  id="receiverName"
                  required
                  value={form.receiverName}
                  onChange={updateField("receiverName")}
                  placeholder="홍길동"
                  className="border-white/15 bg-black/20 text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="receiverPhone">
                  수령인 연락처
                  <RequiredMark />
                </label>
                <Input
                  id="receiverPhone"
                  required
                  value={form.receiverPhone}
                  onChange={updateField("receiverPhone")}
                  placeholder="010-1234-5678"
                  className="border-white/15 bg-black/20 text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="guestEmail">
                주문 안내 이메일
                <RequiredMark />
              </label>
              <Input
                id="guestEmail"
                type="email"
                required
                value={form.guestEmail}
                onChange={updateField("guestEmail")}
                placeholder="guest@example.com"
                className="border-white/15 bg-black/20 text-white"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="block text-sm font-medium text-gray-200">
                  배송 주소
                  <RequiredMark />
                </span>
                <div className="flex flex-wrap justify-end gap-2">
                  {hasOrdererInfo && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddressDialogOpenChange(true)}
                      className="border-white/20 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      <Plus aria-hidden="true" />
                      주소 추가
                    </Button>
                  )}
                </div>
              </div>
              {hasOrdererInfo && (
                <div className="mb-3">
                  <select
                    aria-label="배송지 주소록"
                    defaultValue=""
                    onChange={handleAddressSelect}
                    className="h-10 w-full border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-amber-400"
                  >
                    <option value="" className="bg-[#1d2429] text-gray-300">
                      주소록에서 선택
                    </option>
                    {addresses.map((address) => (
                      <option
                        key={address.id ?? `${address.addressName}-${address.address}`}
                        value={address.id}
                        className="bg-[#1d2429]"
                      >
                        {address.defaultAddress ? "[기본] " : ""}
                        {address.addressName || formatDeliveryAddress(address)}
                      </option>
                    ))}
                  </select>
                  {!hasAddresses && (
                    <p className="mt-2 text-xs text-amber-200">
                      등록된 배송지가 없습니다. 주소 추가로 기본 배송지를 등록해 주세요.
                    </p>
                  )}
                </div>
              )}
              <div className="border-y border-white/10 py-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="inline-flex h-6 w-6 items-center justify-center bg-amber-500 text-black">1</span>
                  <span className="text-amber-200">주소 검색</span>
                  <span className="h-px min-w-8 flex-1 bg-white/10" aria-hidden="true" />
                  <span className="inline-flex h-6 w-6 items-center justify-center bg-white/10 text-gray-300">2</span>
                  <span className="text-gray-300">상세 주소 입력</span>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 md:grid-cols-[170px_1fr] md:items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOrderPostcodeSearch}
                      className="h-9 border-amber-500/60 bg-amber-600 text-black hover:bg-amber-500 hover:text-black"
                    >
                      <Search aria-hidden="true" />
                      배송 주소 검색
                    </Button>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="deliveryPostalCode">
                        우편번호
                      </label>
                      <Input
                        id="deliveryPostalCode"
                        readOnly
                        value={form.deliveryPostalCode}
                        placeholder="04524"
                        className="border-white/15 bg-black/20 text-white read-only:cursor-default"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="deliveryBaseAddress">
                      기본 주소
                      <RequiredMark />
                    </label>
                    <Input
                      id="deliveryBaseAddress"
                      readOnly
                      required
                      value={form.deliveryBaseAddress}
                      placeholder="주소 검색으로 기본 주소를 선택해 주세요."
                      className="border-white/15 bg-black/20 text-white read-only:cursor-default"
                    />
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="deliveryAddressDetail">
                      상세 주소
                    </label>
                    <Input
                      id="deliveryAddressDetail"
                      ref={orderAddressDetailInputRef}
                      value={form.deliveryAddressDetail}
                      onChange={updateField("deliveryAddressDetail")}
                      placeholder="동, 호수, 건물명 등"
                      className="border-white/15 bg-black/20 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="deliveryMemo">
                  배송 메모
                </label>
                <Textarea
                  id="deliveryMemo"
                  value={form.deliveryMemo}
                  onChange={updateField("deliveryMemo")}
                  placeholder="문 앞에 놓아주세요"
                  className="min-h-24 border-white/15 bg-black/20 text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="orderNote">
                  주문 메모
                </label>
                <Textarea
                  id="orderNote"
                  value={form.orderNote}
                  onChange={updateField("orderNote")}
                  placeholder="선물용입니다"
                  className="min-h-24 border-white/15 bg-black/20 text-white"
                />
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-5 border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTossPayment}
              disabled={isPending}
              className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              {isPaymentPending ? "결제 준비 중" : "결제"}
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <Link href="/general-items/cart">취소</Link>
            </Button>
          </div>
        </form>

        <aside className="h-fit border border-white/10 bg-black/20 p-5">
          <h2 className="typo-bold-18 text-white">주문 요약</h2>
          {items.length > 0 && (
            <ul className="mt-5 space-y-3 border-b border-white/10 pb-4">
              {items.map((item) => (
                <li key={item.cartItemId ?? `${item.saleAnnouncementId}-${item.itemName}`} className="text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-300">{item.itemName ?? "장바구니 상품"}</span>
                    <span className="text-white">{item.quantity ?? 0}개</span>
                  </div>
                  <div className="mt-1 text-right text-xs text-gray-400">{formatCartCurrency(item.lineTotalPrice)}</div>
                </li>
              ))}
            </ul>
          )}
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-400">상품 합계</dt>
              <dd className="text-white">{formatCartCurrency(quote.itemsTotalPrice)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-400">배송비</dt>
              <dd className="text-white">{formatCartCurrency(quote.shippingFee)}</dd>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-200">총 결제 금액</dt>
                <dd className="font-bold text-white">{formatCartCurrency(quote.totalPrice)}</dd>
              </div>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-gray-400">
            최종 금액과 주문 가능 여부는 서버 검증 결과를 기준으로 확정됩니다. 같은 주문 시도에서는 멱등키가 유지되어
            중복 주문을 줄입니다.
          </p>
        </aside>
      </div>

      <Dialog open={isAddressDialogOpen} onOpenChange={handleAddressDialogOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>배송지 추가</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleCreateAddress}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="addressName">
                  배송지 이름
                  <RequiredMark />
                </label>
                <Input
                  id="addressName"
                  value={addressForm.addressName}
                  onChange={updateAddressField("addressName")}
                  placeholder="집"
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Checkbox
                  id="defaultAddress"
                  checked={addressForm.defaultAddress}
                  onCheckedChange={(checked) =>
                    setAddressForm((current) => ({ ...current, defaultAddress: checked === true }))
                  }
                />
                <label htmlFor="defaultAddress" className="text-sm text-gray-700">
                  기본 배송지로 설정
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="addressReceiverName">
                  수령인
                  <RequiredMark />
                </label>
                <Input
                  id="addressReceiverName"
                  value={addressForm.receiverName}
                  onChange={updateAddressField("receiverName")}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="addressReceiverPhone">
                  수령인 연락처
                  <RequiredMark />
                </label>
                <Input
                  id="addressReceiverPhone"
                  value={addressForm.receiverPhone}
                  onChange={updateAddressField("receiverPhone")}
                  placeholder="010-1234-5678"
                />
              </div>
            </div>

            <div className="border-y border-gray-200 py-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="inline-flex h-6 w-6 items-center justify-center bg-amber-500 text-black">1</span>
                <span className="text-amber-700">주소 검색</span>
                <span className="h-px min-w-8 flex-1 bg-gray-200" aria-hidden="true" />
                <span className="inline-flex h-6 w-6 items-center justify-center bg-gray-100 text-gray-600">2</span>
                <span className="text-gray-600">상세 주소 입력</span>
              </div>

              <div className="mt-4 grid gap-4">
                <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-end">
                  <Button type="button" variant="outline" onClick={handleAddressFormPostcodeSearch} className="h-9">
                    <Search aria-hidden="true" />
                    우편번호 검색
                  </Button>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="postalCode">
                      우편번호
                    </label>
                    <Input
                      id="postalCode"
                      readOnly
                      value={addressForm.postalCode}
                      placeholder="04524"
                      className="read-only:cursor-default"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="address">
                    기본 주소
                    <RequiredMark />
                  </label>
                  <Input
                    id="address"
                    readOnly
                    value={addressForm.address}
                    placeholder="서울특별시 중구 ..."
                    className="read-only:cursor-default"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="addressDetail">
                    상세 주소
                  </label>
                  <Input
                    id="addressDetail"
                    ref={addressBookDetailInputRef}
                    value={addressForm.addressDetail}
                    onChange={updateAddressField("addressDetail")}
                    placeholder="101호"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="addressDeliveryMemo">
                배송 메모
              </label>
              <Textarea
                id="addressDeliveryMemo"
                value={addressForm.deliveryMemo}
                onChange={updateAddressField("deliveryMemo")}
                placeholder="문 앞에 놓아주세요"
              />
            </div>

            {addressError && <p className="text-sm text-red-600">{addressError}</p>}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddressDialogOpen(false)}>
                닫기
              </Button>
              <Button type="submit" disabled={isAddressPending}>
                {isAddressPending ? "저장 중" : "저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
