import {
  getApiSalesSaleid,
  getApiUsersMe,
  getApiUsersMeDeliveryAddresses,
  getApiV2ShippingPolicy,
  type CartQuoteResponse,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/page-response";
import { notFound, redirect } from "next/navigation";
import { getGeneralItemOrderQuantityLimit, isOpenGeneralItemSale } from "../_lib/general-item-sales";
import CartDeliveryOrderClient from "../cart/order/CartDeliveryOrderClient";

export default async function GeneralItemDeliveryOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ saleId?: string; quantity?: string }>;
}) {
  const params = await searchParams;
  if (!params.saleId) redirect("/general-items/cart/order");
  const saleId = parsePositiveInt(params.saleId);
  const quantity = parsePositiveInt(params.quantity);
  if (!saleId || !quantity) notFound();
  const [saleResponse, policyResponse, token] = await Promise.all([
    getApiSalesSaleid(saleId, { cache: "no-store" }),
    getApiV2ShippingPolicy({ cache: "no-store" }),
    getAuthToken(),
  ]);
  const sale = saleResponse.data;
  const policy = policyResponse.data;
  if (!isOpenGeneralItemSale(sale) || sale.serviceProduct || quantity > getGeneralItemOrderQuantityLimit(sale))
    notFound();
  if (sale.salePrice == null || policy.baseShippingFee == null || policy.freeShippingThreshold == null)
    throw new Error("상품 가격·배송비 정보를 확인할 수 없습니다.");
  // 표시용 견적. 결제 티켓은 서버가 상품·수량·권한·최종 배송비를 다시 검증한다.
  const itemsTotalPrice = sale.salePrice * quantity;
  const shippingFee = itemsTotalPrice >= policy.freeShippingThreshold ? 0 : policy.baseShippingFee;
  const quote: CartQuoteResponse = {
    serviceProduct: false,
    itemsTotalPrice,
    shippingFee,
    totalPrice: itemsTotalPrice + shippingFee,
    items: [
      {
        saleAnnouncementId: saleId,
        itemName: sale.itemName ?? sale.title,
        quantity,
        unitPrice: sale.salePrice,
        lineTotalPrice: itemsTotalPrice,
        valid: true,
      },
    ],
  };
  const [userResult, addressesResult] = token
    ? await Promise.allSettled([getApiUsersMe(withToken(token)), getApiUsersMeDeliveryAddresses(withToken(token))])
    : [];
  return (
    <main className="min-h-screen bg-[#1d2429] pt-16 text-white lg:pt-20">
      <CartDeliveryOrderClient
        quote={quote}
        purchase={{ kind: "direct", saleId, quantity }}
        currentUser={userResult?.status === "fulfilled" ? userResult.value.data : null}
        deliveryAddresses={addressesResult?.status === "fulfilled" ? addressesResult.value.data : []}
      />
    </main>
  );
}
