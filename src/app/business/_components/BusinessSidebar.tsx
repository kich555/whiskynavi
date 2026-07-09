"use client";

import type { BusinessMembershipBusinessResponse } from "@/apis/generated/api";
import { BarChart3, ClipboardList, Home, Layers, Star, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { setPrimaryBusinessAction } from "../actions";

const NAV_ITEMS = [
  {
    href: "/business/statistics",
    label: "통계",
    description: "공고별 단계 현황",
    icon: BarChart3,
  },
  {
    href: "/business/pickup-reservations",
    label: "공고 별 관리",
    description: "공고 기준 신청 현황",
    icon: Layers,
  },
  {
    href: "/business/pickup-reservations/applications",
    label: "예약 건 별 조회",
    description: "신청 건 단위 목록",
    icon: ClipboardList,
  },
  {
    href: "/business/members",
    label: "멤버 관리",
    description: "소유자와 매니저 관리",
    icon: Users,
  },
];

interface BusinessSidebarProps {
  businesses?: BusinessMembershipBusinessResponse[];
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: "소유자",
  MANAGER: "매니저",
};

function isActivePath(pathname: string, href: string) {
  if (href === "/business/pickup-reservations") {
    return pathname.startsWith(href) && !pathname.startsWith("/business/pickup-reservations/applications");
  }
  return pathname.startsWith(href);
}

export default function BusinessSidebar({ businesses = [] }: BusinessSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selectedBusinessId =
    Number(searchParams.get("businessId")) ||
    businesses.find((business) => business.primaryBusiness)?.businessId ||
    businesses[0]?.businessId;

  const handleSelectBusiness = (businessId?: number) => {
    if (!businessId || businessId === selectedBusinessId) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("businessId", String(businessId));
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handleSetPrimaryBusiness = (businessId?: number) => {
    if (!businessId || isPending) return;

    startTransition(async () => {
      const result = await setPrimaryBusinessAction(businessId);
      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-5">
        <p className="text-xs font-bold tracking-wide text-amber-600">PICKUP BUSINESS</p>
        <h1 className="mt-1 text-lg font-bold text-gray-900">픽업 사업장</h1>
      </div>

      <div className="border-b border-gray-200 p-3">
        <p className="px-2 text-xs font-bold text-gray-500">사업장 선택</p>
        <div className="mt-2 space-y-2">
          {businesses.length === 0 ? (
            <p className="px-2 py-3 text-sm text-gray-500">연결된 사업장이 없습니다.</p>
          ) : (
            businesses.map((business) => {
              const businessId = business.businessId;
              const isOwner = business.role === "OWNER";
              const isPrimary = isOwner && Boolean(business.primaryBusiness);
              const isSelected = businessId === selectedBusinessId;
              const canSetPrimary = isOwner && !isPrimary && businessId != null;

              return (
                <div
                  key={businessId ?? business.businessName}
                  className={`rounded-md transition-colors ${
                    isSelected ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <button
                    type="button"
                    disabled={!businessId || businessId === selectedBusinessId}
                    onClick={() => handleSelectBusiness(businessId)}
                    className="w-full px-3 py-2 text-left disabled:cursor-default"
                  >
                    <span className="block truncate text-sm font-bold">
                      {business.businessName ?? "이름 없는 사업장"}
                    </span>
                    <span
                      className={`mt-1 flex items-center gap-2 text-xs ${isSelected ? "text-gray-200" : "text-gray-500"}`}
                    >
                      <span>{ROLE_LABEL[business.role ?? ""] ?? business.role ?? "-"}</span>
                      {isSelected && <span className="rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">선택됨</span>}
                      {isPrimary && <span className="rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">대표</span>}
                    </span>
                  </button>
                  {canSetPrimary && (
                    <button
                      type="button"
                      disabled={isPending}
                      aria-label={`${business.businessName ?? "이름 없는 사업장"} 대표로 지정`}
                      onClick={() => handleSetPrimaryBusiness(businessId)}
                      className={`mx-3 mb-2 inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-bold transition-colors ${
                        isSelected
                          ? "border-white/30 text-white hover:bg-white/10"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white"
                      } disabled:opacity-60`}
                    >
                      <Star size={12} />
                      대표로 지정
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <nav className="space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-start gap-3 rounded-md px-3 py-3 transition-colors ${
                isActive ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <span>
                <span className="block text-sm font-bold">{item.label}</span>
                <span className="mt-0.5 block text-xs opacity-75">{item.description}</span>
              </span>
            </Link>
          );
        })}

        {/* 일반 페이지로 돌아가기 */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-3 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <Home size={18} className="shrink-0" />
            <span className="text-sm font-bold">일반 페이지로 돌아가기</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
