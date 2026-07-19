"use client";

import type { ItemAdminResponse } from "@/apis/generated/api";
import { ROLE_LABEL_MAP } from "@/app/admin/constants";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import { createGeneralItemSaleFormAction } from "../../../general-items/actions";

const ORDERABLE_ROLE_OPTIONS = [
  "ROLE_USER",
  "ROLE_CONSUMER",
  "ROLE_WHISKYNAVI_MEMBER",
  "ROLE_WHISKYTALES_MEMBER",
  "ROLE_BLIND_MEMBER",
] as const;

const SALE_STATUS_OPTIONS = [
  { value: "DRAFT", label: "임시저장" },
  { value: "OPEN", label: "판매중" },
  { value: "CLOSED", label: "판매종료" },
  { value: "SOLD_OUT", label: "품절" },
] as const;

interface GeneralItemSaleCreateContentProps {
  items: ItemAdminResponse[];
  initialValues: {
    productId?: string;
    itemName?: string;
    salePrice?: string;
    totalQuantity?: string;
  };
}

function buildOrderHref(saleId?: number) {
  return saleId != null ? `/general-items/${saleId}` : "/general-items";
}

function getItem(items: ItemAdminResponse[], id: string) {
  return items.find((item) => item.id != null && String(item.id) === id);
}

export default function GeneralItemSaleCreateContent({ items, initialValues }: GeneralItemSaleCreateContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [formState, formAction, isPending] = useActionState(createGeneralItemSaleFormAction, { success: false });

  const [selectedProductId, setSelectedProductId] = useState(initialValues.productId ?? "");
  const initialItem = getItem(items, initialValues.productId ?? "");
  const [itemName, setItemName] = useState(initialValues.itemName ?? initialItem?.name ?? "");
  const [salePrice, setSalePrice] = useState(initialValues.salePrice ?? String(initialItem?.consumerPrice ?? ""));
  const [totalQuantity, setTotalQuantity] = useState(
    initialValues.totalQuantity ?? String(initialItem?.stockQuantity ?? ""),
  );

  const values = formState.values ?? {};
  const createdSale = formState.success ? formState.data : undefined;

  const handleProductChange = (value: string) => {
    setSelectedProductId(value);
    const item = getItem(items, value);
    setItemName(item?.name ?? "");
    setSalePrice(item?.consumerPrice != null ? String(item.consumerPrice) : "");
    setTotalQuantity(item?.stockQuantity != null ? String(item.stockQuantity) : "");
  };

  return (
    <>
      <AdminHeader title="일반상품판매공고 등록" onToggleSidebar={toggle} showSearch={false} />

      <form action={formAction} className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            일반상품 목록으로 돌아가기
          </button>

          <button
            type="submit"
            disabled={isPending || items.length === 0}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            <Save size={16} />
            {isPending ? "저장 중..." : "저장"}
          </button>
        </div>

        {items.length === 0 ? (
 <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 typo-medium-14 text-amber-800">
            판매 공고를 만들 일반상품이 없습니다. 먼저 일반상품을 등록해 주세요.
            <Link href="/admin/general-items/new" className="ml-2 font-semibold underline">
              일반상품 등록
            </Link>
          </div>
        ) : null}

        {formState.error ? (
 <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 typo-medium-14 text-red-600">
            {formState.error}
          </div>
        ) : null}

        {createdSale ? (
 <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 typo-medium-14 text-green-800">
            <p className="font-semibold">일반상품판매공고가 등록되었습니다. 공고 ID: {createdSale.id}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={buildOrderHref(createdSale.id)}
                className="rounded-md bg-green-700 px-3 py-2 text-white hover:bg-green-800"
              >
                상품 화면에서 확인
              </Link>
              <Link href="/admin/general-items" className="rounded-md border border-green-300 px-3 py-2 hover:bg-white">
                일반상품 목록
              </Link>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-5">
              <div>
                <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="productId">
                  판매 상품 *
                </label>
                <select
                  id="productId"
                  name="productId"
                  value={selectedProductId}
                  onChange={(event) => handleProductChange(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">상품을 선택하세요</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.stockQuantity != null ? `(재고 ${item.stockQuantity}개)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="title">
                  판매 공고 제목
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  defaultValue={values.title}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="배송 패키지 한정 판매"
                />
              </div>

              <div>
                <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="itemName">
                  주문 화면 상품명
                </label>
                <input
                  id="itemName"
                  name="itemName"
                  type="text"
                  value={itemName}
                  onChange={(event) => setItemName(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="주문 화면에 표시할 상품명"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="salePrice">
                    판매가 *
                  </label>
                  <input
                    id="salePrice"
                    name="salePrice"
                    type="number"
                    min={1}
                    value={salePrice}
                    onChange={(event) => setSalePrice(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="totalQuantity">
                    총 판매 수량 *
                  </label>
                  <input
                    id="totalQuantity"
                    name="totalQuantity"
                    type="number"
                    min={1}
                    value={totalQuantity}
                    onChange={(event) => setTotalQuantity(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="availableQuantity">
                    판매 가능 수량
                  </label>
                  <input
                    id="availableQuantity"
                    name="availableQuantity"
                    type="number"
                    min={0}
                    defaultValue={values.availableQuantity}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="비우면 총 수량과 동일"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="maxOrderQuantity">
                    1회 최대 주문 수량
                  </label>
                  <input
                    id="maxOrderQuantity"
                    name="maxOrderQuantity"
                    type="number"
                    min={0}
                    defaultValue={values.maxOrderQuantity}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="saleStatus">
                    판매 상태
                  </label>
                  <select
                    id="saleStatus"
                    name="saleStatus"
                    defaultValue={values.saleStatus ?? "OPEN"}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {SALE_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="saleStartAt">
                    판매 시작 시각
                  </label>
                  <input
                    id="saleStartAt"
                    name="saleStartAt"
                    type="datetime-local"
                    defaultValue={values.saleStartAt}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="saleEndAt">
                    판매 종료 시각
                  </label>
                  <input
                    id="saleEndAt"
                    name="saleEndAt"
                    type="datetime-local"
                    defaultValue={values.saleEndAt}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-lg border border-gray-200 bg-gray-50 p-5">
              <h3 className="font-semibold text-gray-900">주문 가능 역할</h3>
 <p className="mt-1 typo-medium-14 leading-5 text-gray-600">
                아무 역할도 선택하지 않으면 비회원까지 주문 가능한 일반 판매로 등록됩니다.
              </p>
              <div className="mt-4 grid gap-3">
                {ORDERABLE_ROLE_OPTIONS.map((role) => (
 <label key={role} className="flex items-center gap-2 typo-medium-14 text-gray-700">
                    <input
                      type="checkbox"
                      name="orderableRoles"
                      value={role}
                      className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    {ROLE_LABEL_MAP[role] ?? role}
                  </label>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </form>
    </>
  );
}
