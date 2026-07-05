"use client";

import { Award, Ban, Calendar, FileSpreadsheet, MessageSquare, Package, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import AdminHeader from "./AdminHeader";
import { useSidebar } from "./AdminLayoutClient";

const quickLinks = [
  {
    title: "회원 관리",
    description: "회원 목록 조회 및 관리",
    icon: Users,
    href: "/admin/users",
    color: "bg-blue-500",
  },
  {
    title: "보틀관리",
    description: "보틀 등록 및 수정",
    icon: Package,
    href: "/admin/products",
    color: "bg-green-500",
  },
  {
    title: "보틀예약관리",
    description: "보틀 예약 공고 및 신청 관리",
    icon: Calendar,
    href: "/admin/reservations",
    color: "bg-amber-500",
  },
  {
    title: "보틀주문관리",
    description: "보틀 주문 조회",
    icon: ShoppingCart,
    href: "/admin/bottle-orders",
    color: "bg-lime-600",
  },
  {
    title: "구매내역 대량 등록",
    description: "Excel로 수동 구매내역 등록",
    icon: FileSpreadsheet,
    href: "/admin/manual-purchases/import",
    color: "bg-fuchsia-600",
  },
  {
    title: "일반상품관리",
    description: "배송 주문용 일반상품 조회",
    icon: Package,
    href: "/admin/general-items",
    color: "bg-sky-500",
  },
  {
    title: "일반상품 등록",
    description: "배송 주문용 일반상품 생성",
    icon: Package,
    href: "/admin/general-items/new",
    color: "bg-emerald-500",
  },
  {
    title: "일반상품판매공고관리",
    description: "일반상품 판매 공고 조회",
    icon: Calendar,
    href: "/admin/general-item-sales",
    color: "bg-orange-500",
  },
  {
    title: "일반상품주문관리",
    description: "일반상품 배송 주문 처리",
    icon: ShoppingCart,
    href: "/admin/general-item-orders",
    color: "bg-cyan-600",
  },
  {
    title: "일반상품판매공고 등록",
    description: "일반 아이템 판매 공고 생성",
    icon: Calendar,
    href: "/admin/general-item-sales/new",
    color: "bg-rose-500",
  },
  {
    title: "멤버십 관리",
    description: "멤버십 혜택 설정",
    icon: Award,
    href: "/admin/membership",
    color: "bg-purple-500",
  },
  {
    title: "블랙리스트",
    description: "제재 회원 관리",
    icon: Ban,
    href: "/admin/blacklist",
    color: "bg-red-500",
  },
  {
    title: "게시판 관리",
    description: "커뮤니티 게시판 설정",
    icon: MessageSquare,
    href: "/admin/boards",
    color: "bg-indigo-500",
  },
];

interface DashboardContentProps {
  statsSlot: ReactNode;
}

export default function DashboardContent({ statsSlot }: DashboardContentProps) {
  const { toggle } = useSidebar();

  return (
    <>
      <AdminHeader title="대시보드" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        {statsSlot}

        <h2 className="typo-bold-20 mb-4 text-gray-900">빠른 링크</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className={`${link.color} rounded-lg p-3 text-white transition-transform group-hover:scale-110`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{link.title}</h3>
                    <p className="text-sm text-gray-500">{link.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
