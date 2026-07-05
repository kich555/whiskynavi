import type { UserDeliveryAddressResponse } from "@/apis/generated/api";

export function formatDeliveryAddress(address: UserDeliveryAddressResponse): string {
  const streetAddress = [address.address, address.addressDetail].filter(Boolean).join(" ");
  return [address.postalCode ? `(${address.postalCode})` : "", streetAddress].filter(Boolean).join(" ");
}

export function getDefaultAddress(addresses: UserDeliveryAddressResponse[]): UserDeliveryAddressResponse | null {
  return addresses.find((address) => address.defaultAddress) ?? null;
}

export function formatOrderDeliveryAddress(form: {
  deliveryPostalCode: string;
  deliveryBaseAddress: string;
  deliveryAddressDetail: string;
}): string {
  const baseAddress = [
    form.deliveryPostalCode ? `(${form.deliveryPostalCode})` : "",
    form.deliveryBaseAddress.trim(),
  ]
    .filter(Boolean)
    .join(" ");
  return [baseAddress, form.deliveryAddressDetail.trim()].filter(Boolean).join(" ");
}
