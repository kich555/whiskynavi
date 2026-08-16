"use client";

import {
  Award,
  Ban,
  BookOpenText,
  Briefcase,
  Calendar,
  FilePenLine,
  FileSpreadsheet,
  History,
  Home,
  ImageIcon,
  Layers3,
  MapPin,
  MessageCircleQuestion,
  MessageSquare,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const menuGroups: { id: string; label: string; items: MenuItem[] }[] = [
  {
    id: "members",
    label: "회원",
    items: [
      { id: "users", label: "회원 관리", icon: Users, href: "/admin/users" },
      {
        id: "membership",
        label: "멤버십 관리",
        icon: Award,
        href: "/admin/membership",
      },
      {
        id: "business-applications",
        label: "사업자 신청 관리",
        icon: Briefcase,
        href: "/admin/businesses/applications",
      },
      {
        id: "business-members",
        label: "사업자 관리",
        icon: Briefcase,
        href: "/admin/businesses/members",
      },
      { id: "blacklist", label: "블랙리스트", icon: Ban, href: "/admin/blacklist" },
      {
        id: "post-restrictions",
        label: "게시글 작성 제한",
        icon: FilePenLine,
        href: "/admin/post-restrictions",
      },
    ],
  },
  {
    id: "bottles",
    label: "보틀",
    items: [
      {
        id: "products",
        label: "보틀관리",
        icon: Package,
        href: "/admin/products",
      },
      {
        id: "bottle-series",
        label: "보틀 시리즈 관리",
        icon: Layers3,
        href: "/admin/bottle-series",
      },
      {
        id: "reservations",
        label: "보틀예약관리",
        icon: Calendar,
        href: "/admin/reservations",
      },
      {
        id: "business-reservation-pickup",
        label: "비즈니스 픽업 설정",
        icon: MapPin,
        href: "/admin/reservations/business-pickup-location",
      },
      {
        id: "bottle-orders",
        label: "보틀주문관리",
        icon: ShoppingCart,
        href: "/admin/bottle-orders",
      },
      {
        id: "manual-purchase-import",
        label: "구매내역 대량 등록",
        icon: FileSpreadsheet,
        href: "/admin/manual-purchases/import",
      },
      {
        id: "series",
        label: "시리즈관리",
        icon: BookOpenText,
        href: "/admin/series",
      },
    ],
  },
  {
    id: "general-items",
    label: "일반상품",
    items: [
      {
        id: "general-items",
        label: "일반상품관리",
        icon: Package,
        href: "/admin/general-items",
      },
      {
        id: "general-item-sales",
        label: "일반상품판매공고관리",
        icon: Calendar,
        href: "/admin/general-item-sales",
      },
      {
        id: "general-item-orders",
        label: "일반상품주문관리",
        icon: ShoppingCart,
        href: "/admin/general-item-orders",
      },
      {
        id: "shipping-policy",
        label: "배송비 정책",
        icon: Truck,
        href: "/admin/shipping-policy",
      },
    ],
  },
  {
    id: "operations",
    label: "주문/운영",
    items: [
      {
        id: "inquiries",
        label: "1:1 문의 관리",
        icon: MessageCircleQuestion,
        href: "/admin/inquiries",
      },
      {
        id: "banners",
        label: "배너 관리",
        icon: ImageIcon,
        href: "/admin/banners",
      },
      {
        id: "youtube",
        label: "YouTube 관리",
        icon: Youtube,
        href: "/admin/youtube",
      },
      {
        id: "boards",
        label: "게시판 관리",
        icon: MessageSquare,
        href: "/admin/boards",
      },
      {
        id: "board-management-history",
        label: "게시판 관리기록",
        icon: History,
        href: "/admin/board-management-history",
      },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  statsSlot: ReactNode;
}

export default function AdminSidebar({ isOpen, statsSlot }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      className={`${isOpen ? "w-64" : "w-0"} shrink-0 overflow-hidden border-r border-gray-200 bg-white transition-all duration-300`}
    >
      <div className="p-6">
        <Link href="/admin">
          <h1 className="typo-bold-24 mb-2 text-gray-900">관리자</h1>
        </Link>
        <p className="typo-medium-14 text-gray-600">위스키내비 운영 관리</p>
      </div>

      <nav className="px-3">
        {menuGroups.map((group, groupIndex) => (
          <div key={group.id} className={groupIndex === 0 ? "pb-3" : "border-t border-gray-200 py-3"}>
            <p className="px-4 pb-2 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <div key={item.id} className="mb-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                      active ? "bg-amber-50 font-semibold text-amber-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        ))}

        {/* 일반 페이지로 돌아가기 */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <Link
            href="/"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <Home size={20} />
            <span>일반 페이지로 돌아가기</span>
          </Link>
        </div>
      </nav>

      {/* 통계 요약 - Suspense로 streaming */}
      {statsSlot}
    </div>
  );
}
