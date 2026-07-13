import {
  TERMS_CONTACT_EMAIL,
  TERMS_CONTACT_PHONE,
  TERMS_EFFECTIVE_DATE,
  TERMS_REPRESENTATIVE,
  TERMS_SECTIONS,
} from "@/lib/terms";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  description: "위스키내비 서비스 이용약관과 상품의 배송, 교환, 반품 및 환불 정책을 확인하세요.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#1d2429] pt-20 pb-12 text-white lg:pt-24 lg:pb-20">
      <div className="mx-auto max-w-4xl px-4 lg:px-10">
        <header className="border-b border-white/15 pb-8 md:pb-10">
          <p className="text-xs font-semibold tracking-[0.22em] text-amber-500 uppercase">Terms of Service</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">이용약관</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400">
            위스키내비 서비스 이용과 상품의 주문, 배송, 교환·반품 및 환불에 관한 기준입니다.
          </p>
          <p className="mt-3 text-xs text-gray-500">시행일: {TERMS_EFFECTIVE_DATE}</p>
        </header>

        <div className="divide-y divide-white/10">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.title} className="py-7 md:py-9">
              <h2 className="text-lg font-semibold text-white md:text-xl">{section.title}</h2>
              <div className="mt-4 space-y-2.5 text-sm leading-7 text-gray-300 md:text-[15px]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="border-t border-white/15 pt-7 md:pt-9">
          <h2 className="text-lg font-semibold text-white md:text-xl">부칙</h2>
          <p className="mt-4 text-sm leading-7 text-gray-300 md:text-[15px]">
            이 약관은 {TERMS_EFFECTIVE_DATE}부터 시행합니다.
          </p>
        </section>

        <aside className="mt-10 border border-white/10 bg-white/5 p-5 text-sm leading-6 text-gray-300 md:p-6">
          <p className="font-semibold text-white">약관 및 주문 관련 문의</p>
          <p className="mt-2">
            주식회사 캐스크야드 · 대표 {TERMS_REPRESENTATIVE} · {TERMS_CONTACT_PHONE} · {TERMS_CONTACT_EMAIL}
          </p>
        </aside>
      </div>
    </main>
  );
}
