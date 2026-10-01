"use client";

import type { AdminSaleAnnouncementResponse } from "@/apis/generated/api";
import { ROLE_LABEL_MAP } from "@/app/admin/constants";
import { formatDateTime } from "@/lib/formatters";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import { updateGeneralItemSale, type SaleUpdateResult } from "../../actions";

const inputClass =
  "typo-medium-14 mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none";
const statusOptions = { DRAFT: "임시저장", OPEN: "판매중", CLOSED: "판매종료", SOLD_OUT: "품절" };
const roleOptions = [
  "ROLE_USER",
  "ROLE_CONSUMER",
  "ROLE_WHISKYNAVI_MEMBER",
  "ROLE_WHISKYTALES_MEMBER",
  "ROLE_BLIND_MEMBER",
];

function formValues(sale: AdminSaleAnnouncementResponse) {
  return {
    title: sale.title ?? "",
    salePrice: String(sale.salePrice ?? ""),
    saleStatus: sale.saleStatus ?? "DRAFT",
    totalQuantity: String(sale.totalQuantity ?? ""),
    availableQuantity: String(sale.availableQuantity ?? ""),
    maxOrderQuantity: String(sale.maxOrderQuantity ?? ""),
    saleStartAt: sale.saleStartAt ?? "",
    saleEndAt: sale.saleEndAt ?? "",
    stockAdjustmentReason: "",
  };
}

export default function GeneralItemSaleDetailContent({
  saleId,
  sale,
}: {
  saleId: number;
  sale: AdminSaleAnnouncementResponse;
}) {
  const { toggle } = useSidebar();
  const [current, setCurrent] = useState(sale);
  const [values, setValues] = useState(formValues(sale));
  const [roles, setRoles] = useState(sale.orderableRoles ?? []);
  const [adjustStock, setAdjustStock] = useState(false);
  const [state, action, pending] = useActionState(
    async (_previous: SaleUpdateResult, data: FormData) => {
      const result = await updateGeneralItemSale(saleId, data);
      if (result.success && result.data) {
        setCurrent(result.data);
        setValues(formValues(result.data));
        setRoles(result.data.orderableRoles ?? []);
        setAdjustStock(false);
      }
      return result;
    },
    { success: false },
  );
  const availableRoles = Array.from(new Set([...roleOptions, ...(current.orderableRoles ?? [])]));
  const setValue = (key: keyof typeof values, value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  return (
    <>
      <AdminHeader title="일반상품판매공고 상세 관리" onToggleSidebar={toggle} showSearch={false} />
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin/general-item-sales" className="typo-medium-14 text-gray-600 hover:underline">
            판매공고 목록으로 돌아가기
          </Link>
          <Link href={`/general-items/${saleId}`} className="typo-medium-14 text-amber-700 hover:underline">
            상품 화면 보기
          </Link>
        </div>
        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="typo-bold-18 text-gray-900">
            공고 #{saleId} · {current.itemName}
          </h2>
          <p className="typo-medium-14 mt-3 text-gray-600">
            {current.serviceProduct ? "티켓·무형서비스" : "실물 상품"} · 총 {current.totalQuantity}개 / 판매 가능{" "}
            {current.availableQuantity}개
          </p>
          {current.productId != null && (
            <Link
              href={`/admin/general-items/${current.productId}`}
              className="typo-medium-14 mt-3 inline-block text-amber-700 hover:underline"
            >
              원본 상품 관리
            </Link>
          )}
          {current.serviceProduct && (
            <p className="typo-medium-14 mt-3 leading-relaxed text-gray-600">
              이용 기간: {formatDateTime(current.serviceValidFrom)} ~ {formatDateTime(current.serviceValidUntil)}
              <br />
              상품 유형과 이용 기간은 등록 후 변경할 수 없습니다.
            </p>
          )}
        </section>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (pending) return;
            const data = new FormData(event.currentTarget);
            startTransition(() => action(data));
          }}
        >
          {state.error && (
            <p role="alert" className="typo-medium-14 mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {state.error}
            </p>
          )}
          {state.success && (
            <p
              role="status"
              className="typo-medium-14 mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
            >
              판매공고가 수정되었습니다.
            </p>
          )}
          <fieldset disabled={pending} className="space-y-6 disabled:opacity-60">
            <div className="grid gap-5 rounded-lg border border-gray-200 bg-white p-5 md:grid-cols-2">
              <label className="typo-medium-14 text-gray-700 md:col-span-2">
                공고 제목
                <input
                  name="title"
                  value={values.title}
                  onChange={(e) => setValue("title", e.target.value)}
                  required
                  maxLength={200}
                  className={inputClass}
                />
              </label>
              <label className="typo-medium-14 text-gray-700">
                판매가 (원)
                <input
                  name="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.salePrice}
                  onChange={(e) => setValue("salePrice", e.target.value)}
                  required
                  className={inputClass}
                />
              </label>
              <label className="typo-medium-14 text-gray-700">
                판매 상태
                <select
                  name="saleStatus"
                  value={values.saleStatus}
                  onChange={(e) => setValue("saleStatus", e.target.value)}
                  className={inputClass}
                >
                  {Object.entries(statusOptions).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="typo-medium-14 text-gray-700">
                1회 최대 주문 수량
                <input
                  name="maxOrderQuantity"
                  type="number"
                  min="1"
                  step="1"
                  value={values.maxOrderQuantity}
                  onChange={(e) => setValue("maxOrderQuantity", e.target.value)}
                  className={inputClass}
                />
              </label>
              <p className="typo-medium-14 self-center leading-relaxed text-gray-500">
                최대 주문 수량과 판매 기간을 비우면 기존 설정을 유지합니다. 이미 설정한 제한과 기간의 해제는 지원하지
                않습니다.
              </p>
              <label className="typo-medium-14 text-gray-700">
                판매 시작 시각
                <input
                  name="saleStartAt"
                  type="datetime-local"
                  step="1"
                  value={values.saleStartAt}
                  onChange={(e) => setValue("saleStartAt", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="typo-medium-14 text-gray-700">
                판매 종료 시각
                <input
                  name="saleEndAt"
                  type="datetime-local"
                  step="1"
                  value={values.saleEndAt}
                  onChange={(e) => setValue("saleEndAt", e.target.value)}
                  className={inputClass}
                />
              </label>
              <fieldset className="md:col-span-2">
                <legend className="typo-bold-14 text-gray-700">주문 가능 역할</legend>
                <p className="typo-medium-14 mt-2 text-gray-500">선택하지 않으면 역할 제한을 두지 않습니다.</p>
                <div className="mt-3 flex flex-wrap gap-4">
                  {availableRoles.map((role) => (
                    <label key={role} className="typo-medium-14 flex items-center gap-2 text-gray-700">
                      <input
                        type="checkbox"
                        name="orderableRoles"
                        value={role}
                        checked={roles.includes(role)}
                        onChange={(e) =>
                          setRoles((previous) =>
                            e.target.checked ? [...previous, role] : previous.filter((value) => value !== role),
                          )
                        }
                      />
                      {ROLE_LABEL_MAP[role] ?? role}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <label className="typo-bold-14 flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  name="adjustStock"
                  checked={adjustStock}
                  onChange={(e) => setAdjustStock(e.target.checked)}
                />
                재고 수량 조정
              </label>
              <p className="typo-medium-14 mt-3 leading-relaxed text-gray-500">
                수량 조정을 선택한 경우에만 재고를 변경합니다. 조회 후 재고가 달라지면 저장이 거부되므로 페이지를
                새로고침한 뒤 확인해 주세요. 추가 입고 시 총 판매 수량도 함께 늘려 주세요.
              </p>
              {adjustStock && (
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <input type="hidden" name="expectedAvailableQuantity" value={current.availableQuantity ?? ""} />
                  <label className="typo-medium-14 text-gray-700">
                    총 판매 수량
                    <input
                      type="number"
                      name="totalQuantity"
                      min="1"
                      step="1"
                      required
                      value={values.totalQuantity}
                      onChange={(e) => setValue("totalQuantity", e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="typo-medium-14 text-gray-700">
                    판매 가능 수량
                    <input
                      type="number"
                      name="availableQuantity"
                      min="0"
                      step="1"
                      required
                      value={values.availableQuantity}
                      onChange={(e) => setValue("availableQuantity", e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="typo-medium-14 text-gray-700 md:col-span-2">
                    재고 조정 사유
                    <textarea
                      name="stockAdjustmentReason"
                      required
                      maxLength={200}
                      value={values.stockAdjustmentReason}
                      onChange={(e) => setValue("stockAdjustmentReason", e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>
              )}
            </section>
            <button
              type="submit"
              className="typo-bold-14 w-full cursor-pointer rounded-lg bg-amber-600 px-6 py-3 text-white hover:bg-amber-700 disabled:cursor-wait md:w-auto"
            >
              {pending ? "저장 중..." : "변경사항 저장"}
            </button>
          </fieldset>
        </form>
      </div>
    </>
  );
}
