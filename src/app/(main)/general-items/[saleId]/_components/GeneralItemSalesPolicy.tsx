import { formatCurrency } from "@/lib/formatters";
import { TERMS_CONTACT_EMAIL, TERMS_CONTACT_PHONE, TERMS_REPRESENTATIVE } from "@/lib/terms";
import Link from "next/link";

const BASE_SHIPPING_FEE = 3000;

const deliveryPolicy = [
  { label: "배송업체", value: "CJ대한통운" },
  { label: "배송지역", value: "CJ대한통운 배송 가능 지역" },
  { label: "기본 배송비", value: formatCurrency(BASE_SHIPPING_FEE) },
  { label: "예상 배송기간", value: "결제 완료 후 통상 2~5영업일 (주말·공휴일 제외)" },
];

export default function GeneralItemSalesPolicy() {
  return (
    <section aria-labelledby="general-item-sales-policy" className="mt-10 border border-white/10 bg-white/5 p-5 md:p-8">
      <div className="border-b border-white/10 pb-5">
        <h2 id="general-item-sales-policy" className="text-xl font-semibold text-white md:text-2xl">
          판매정책
        </h2>
        <p className="typo-medium-14 mt-2 leading-6 text-gray-400">주문 전에 배송과 교환·반품 조건을 확인해 주세요.</p>
      </div>

      <dl className="mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
        {deliveryPolicy.map((item) => (
          <div key={item.label} className="typo-medium-14 grid grid-cols-[110px_1fr] gap-3 bg-[#252c31] px-4 py-4">
            <dt className="text-gray-400">{item.label}</dt>
            <dd className="text-gray-100">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="typo-medium-14 mt-6 grid gap-3 leading-6 text-gray-300">
        <p>
          상품 수령일로부터 7일 이내에 청약철회, 교환 또는 반품을 신청할 수 있습니다. 단순 변심에 따른 반품 배송비는
          구매자가 부담하며, 상품 하자 또는 오배송에 따른 비용은 회사가 부담합니다.
        </p>
        <p>
          대표자 연락처({TERMS_REPRESENTATIVE}, {TERMS_CONTACT_PHONE}) 또는 문의 이메일({TERMS_CONTACT_EMAIL})로
          주문번호, 구매자명과 신청 사유를 전달해 주세요.
        </p>
        <p className="typo-medium-12 text-gray-500">
          무료배송 혜택 또는 추가 배송비가 적용되는 경우 주문서에 표시되는 최종 배송비가 우선합니다.
        </p>
      </div>

      <Link
        href="/terms"
        className="typo-semibold-14 mt-6 inline-flex text-amber-500 underline-offset-4 transition-colors hover:text-amber-400 hover:underline"
      >
        전체 이용약관 및 판매정책 보기
      </Link>
    </section>
  );
}
