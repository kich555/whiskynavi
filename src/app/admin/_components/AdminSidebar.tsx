"use client";

import { Award, Ban, Briefcase, Calendar, Home, ImageIcon, Package, Users, Youtube } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const menuItems = [
  { id: "users", label: "회원 관리", icon: Users, href: "/admin/users" },
  {
    id: "products",
    label: "제품 관리",
    icon: Package,
    href: "/admin/products",
  },
  {
    id: "reservations",
    label: "예약 관리",
    icon: Calendar,
    href: "/admin/reservations",
  },
  {
    id: "membership",
    label: "멤버십 관리",
    icon: Award,
    href: "/admin/membership",
  },
  {
    id: "banners",
    label: "배너 관리",
    icon: ImageIcon,
    href: "/admin/banners",
  },
  {
    id: "businesses",
    label: "사업자 관리",
    icon: Briefcase,
    href: "/admin/businesses",
  },
  { id: "blacklist", label: "블랙리스트", icon: Ban, href: "/admin/blacklist" },
  {
    id: "youtube",
    label: "YouTube 관리",
    icon: Youtube,
    href: "/admin/youtube",
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
        <p className="text-sm text-gray-600">위스키내비 운영 관리</p>
      </div>

      <nav className="px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                active ? "bg-amber-50 font-semibold text-amber-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}

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
