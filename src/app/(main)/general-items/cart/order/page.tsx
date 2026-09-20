import {
  getApiUsersMe,
  getApiUsersMeDeliveryAddresses,
  type UserDeliveryAddressResponse,
  type UserSelfResponse,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { fetchCartQuote } from "../actions";
import CartDeliveryOrderClient from "./CartDeliveryOrderClient";

const EMPTY_QUOTE = { serviceProduct: false, items: [], itemsTotalPrice: 0, shippingFee: 0, totalPrice: 0 };

export default async function GeneralItemCartDeliveryOrderPage() {
  const quoteResult = await fetchCartQuote();

  const quote = quoteResult.success && quoteResult.data ? quoteResult.data : EMPTY_QUOTE;

  const token = await getAuthToken();
  let currentUser: UserSelfResponse | null = null;
  let deliveryAddresses: UserDeliveryAddressResponse[] = [];

  if (token) {
    const options = withToken(token);
    const [userResult, addressResult] = await Promise.allSettled([
      getApiUsersMe(options),
      quote.serviceProduct ? Promise.resolve({ data: [] }) : getApiUsersMeDeliveryAddresses(options),
    ]);

    if (userResult.status === "fulfilled") {
      currentUser = userResult.value.data;
    }

    if (addressResult.status === "fulfilled") {
      deliveryAddresses = addressResult.value.data;
    }
  }

  return (
    <main className="min-h-screen bg-[#1d2429] pt-16 text-white lg:pt-20">
      <CartDeliveryOrderClient quote={quote} currentUser={currentUser} deliveryAddresses={deliveryAddresses} />
    </main>
  );
}
