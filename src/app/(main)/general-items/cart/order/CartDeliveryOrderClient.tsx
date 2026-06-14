"use client";

import type {
  CartQuoteResponse,
  UserDeliveryAddressResponse,
  UserSelfResponse,
} from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { toast } from "sonner";
import { formatCartCurrency, getValidCartItems } from "../_lib/cart-utils";
import {
  createGeneralItemCartTossTicket,
  type GeneralItemCartDeliveryOrderInput,
} from "./actions";
import {
  formatDeliveryAddress,
  formatOrderDeliveryAddress,
  getDefaultAddress,
} from "./_lib/address-utils";
import { loadKakaoPostcodeScript, resolvePostcodeAddress } from "./_lib/kakao-postcode";
import { requestTossPayment } from "./_lib/toss-payments";
import { AddressDialog } from "./_components/AddressDialog";

interface CartDeliveryOrderClientProps {
  quote: CartQuoteResponse;
  currentUser?: UserSelfResponse | null;
  deliveryAddresses?: UserDeliveryAddressResponse[];
}

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

export default function CartDeliveryOrderClient({
  quote,
  currentUser,
  deliveryAddresses = [],
}: CartDeliveryOrderClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const attemptKeyRef = useRef("");
  const orderAddressDetailInputRef = useRef<HTMLInputElement>(null);
  const openedForSameAsOrderer = useRef(false);
  const [isSameAsOrderer, setIsSameAsOrderer] = useState(false);
  const [addresses, setAddresses] = useState(deliveryAddresses);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
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
    if (attemptKeyRef.current) return attemptKeyRef.current;
    attemptKeyRef.current = createAttemptKey();
    return attemptKeyRef.current;
  };

  const updateField =
    (field: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
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
      openedForSameAsOrderer.current = true;
      setIsAddressDialogOpen(true);
    }
  };

  const handleAddressDialogOpenChange = (open: boolean) => {
    setIsAddressDialogOpen(open);
    if (!open && openedForSameAsOrderer.current) {
      openedForSameAsOrderer.current = false;
      setIsSameAsOrderer(false);
    }
  };

  const handleAddressSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const addressId = Number(event.target.value);
    const selectedAddress = addresses.find((address) => address.id === addressId);
    if (selectedAddress) applyAddress(selectedAddress);
  };

  const handleAddressCreated = (newAddress: UserDeliveryAddressResponse) => {
    openedForSameAsOrderer.current = false;
    setAddresses((current) => {
      const next = newAddress.defaultAddress
        ? current.map((a) => ({ ...a, defaultAddress: false }))
        : current;
      return [...next, newAddress];
    });
    applyAddress(newAddress);
  };

  const handleOrderPostcodeSearch = () => {
    loadKakaoPostcodeScript()
      .then((Postcode) => {
        new Postcode({
          oncomplete: (data) => {
            setForm((current) => ({
              ...current,
              deliveryPostalCode: data.zonecode ?? "",
              deliveryBaseAddress: resolvePostcodeAddress(data),
            }));
            orderAddressDetailInputRef.current?.focus();
          },
        }).open();
      })
      .catch((postcodeError) => {
        toast.error(
          postcodeError instanceof Error
            ? postcodeError.message
            : "주소 검색 서비스를 불러오지 못했습니다.",
        );
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

    startTransition(async () => {
      try {
        const result = await createGeneralItemCartTossTicket(input, idempotencyKey);

        if (!result.success || !result.data?.ticket) {
          attemptKeyRef.current = "";
          toast.error(result.error ?? "토스 결제 준비에 실패했습니다.");
          return;
        }

        await requestTossPayment(result.data.ticket, input);
      } catch (paymentError) {
        attemptKeyRef.current = "";
        toast.error(
          paymentError instanceof Error
            ? paymentError.message
            : "토스 결제를 시작하지 못했습니다.",
        );
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <div className="border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-amber-300">GENERAL / ITEM 장바구니 배송 주문</p>
          <h1 className="typo-bold-24 mt-2 text-white md:text-3xl">
            장바구니에 담긴 상품이 없습니다.
          </h1>
          <p className="mt-4 text-sm text-gray-400">
            주문할 상품을 장바구니에 담은 뒤 다시 진행해 주세요.
          </p>
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
        <form
          className="border border-white/10 bg-white/5 p-5 md:p-8"
          onSubmit={(event) => event.preventDefault()}
        >
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
                <Label htmlFor="sameAsOrderer" className="text-sm font-medium text-gray-200">
                  주문자와 같음
                </Label>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label
                  className="mb-2 text-sm font-medium text-gray-200"
                  htmlFor="receiverName"
                  required
                  requiredClassName="text-amber-400"
                >
                  수령인
                </Label>
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
                <Label
                  className="mb-2 text-sm font-medium text-gray-200"
                  htmlFor="receiverPhone"
                  required
                  requiredClassName="text-amber-400"
                >
                  수령인 연락처
                </Label>
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
              <Label
                className="mb-2 text-sm font-medium text-gray-200"
                htmlFor="guestEmail"
                required
                requiredClassName="text-amber-400"
              >
                주문 안내 이메일
              </Label>
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
                <span className="block text-sm font-medium text-gray-200">배송 주소</span>
                <div className="flex flex-wrap justify-end gap-2">
                  {hasOrdererInfo && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddressDialogOpen(true)}
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
                  <span className="inline-flex h-6 w-6 items-center justify-center bg-amber-500 text-black">
                    1
                  </span>
                  <span className="text-amber-200">주소 검색</span>
                  <span className="h-px min-w-8 flex-1 bg-white/10" aria-hidden="true" />
                  <span className="inline-flex h-6 w-6 items-center justify-center bg-white/10 text-gray-300">
                    2
                  </span>
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
                      <Label
                        className="mb-2 text-sm font-medium text-gray-200"
                        htmlFor="deliveryPostalCode"
                      >
                        우편번호
                      </Label>
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
                    <Label
                      className="mb-2 text-sm font-medium text-gray-200"
                      htmlFor="deliveryBaseAddress"
                      required
                      requiredClassName="text-amber-400"
                    >
                      기본 주소
                    </Label>
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
                    <Label
                      className="mb-2 text-sm font-medium text-gray-200"
                      htmlFor="deliveryAddressDetail"
                    >
                      상세 주소
                    </Label>
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
                <Label
                  className="mb-2 text-sm font-medium text-gray-200"
                  htmlFor="deliveryMemo"
                >
                  배송 메모
                </Label>
                <Textarea
                  id="deliveryMemo"
                  value={form.deliveryMemo}
                  onChange={updateField("deliveryMemo")}
                  placeholder="문 앞에 놓아주세요"
                  className="min-h-24 border-white/15 bg-black/20 text-white"
                />
              </div>

              <div>
                <Label
                  className="mb-2 text-sm font-medium text-gray-200"
                  htmlFor="orderNote"
                >
                  주문 메모
                </Label>
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

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTossPayment}
              disabled={isPending}
              className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              {isPending ? "결제 준비 중" : "결제"}
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
                <li
                  key={item.cartItemId ?? `${item.saleAnnouncementId}-${item.itemName}`}
                  className="text-sm"
                >
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-300">{item.itemName ?? "장바구니 상품"}</span>
                    <span className="text-white">{item.quantity ?? 0}개</span>
                  </div>
                  <div className="mt-1 text-right text-xs text-gray-400">
                    {formatCartCurrency(item.lineTotalPrice)}
                  </div>
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
            최종 금액과 주문 가능 여부는 서버 검증 결과를 기준으로 확정됩니다. 같은 주문 시도에서는
            멱등키가 유지되어 중복 주문을 줄입니다.
          </p>
        </aside>
      </div>

      <AddressDialog
        open={isAddressDialogOpen}
        onOpenChange={handleAddressDialogOpenChange}
        currentUser={currentUser}
        onAddressCreated={handleAddressCreated}
      />
    </>
  );
}
