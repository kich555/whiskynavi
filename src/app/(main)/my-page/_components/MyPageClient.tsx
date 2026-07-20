"use client";

import type {
  PagedModelUserOrderResponse,
  UserBusinessApplicationOverviewResponse,
  UserSelfResponse,
} from "@/apis/generated/api";
import { Crown, Package } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import BusinessRegistrationSection from "./BusinessRegistrationSection";
import FaqSection from "./FaqSection";
import MembershipTab from "./MembershipTab";
import OrdersTab from "./OrdersTab";
import UserProfileCard from "./UserProfileCard";
interface MyPageClientProps {
  user: UserSelfResponse;
  orders: PagedModelUserOrderResponse;
  businessApplicationOverview: UserBusinessApplicationOverviewResponse | null;
}

export default function MyPageClient({ user, orders, businessApplicationOverview }: MyPageClientProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "membership" ? "membership" : "orders";
  const [activeTab, setActiveTab] = useState<"orders" | "membership">(initialTab);

  const handleTabChange = (tab: "orders" | "membership") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    if (tab !== "orders") params.delete("page");
    window.history.replaceState(null, "", `/my-page?${params.toString()}`);
  };

  return (
    <div className="mt-20 min-h-screen bg-[#1d2429] px-4 py-8 sm:mt-16 sm:px-6 md:py-12 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="mb-3 md:mb-8">
          <h1 className="typo-bold-30 text-white md:text-4xl">마이페이지</h1>
        </div>

        {/* User Info Card */}
        <UserProfileCard user={user} />

        {/* Tabs */}
        <div className="mb-6 overflow-hidden border border-white/10 bg-white/5 md:mb-8">
          <div className="border-b border-white/10">
            <nav className="flex">
              <button
                onClick={() => handleTabChange("orders")}
                className={`typo-semibold-14 flex-1 px-4 py-3 text-center transition-colors md:px-6 md:py-4 md:text-base ${
                  activeTab === "orders" ? "border-b-2 border-white text-white" : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <Package size={16} className="mr-1 inline-block md:mr-2 md:size-5" />
                주문내역
              </button>
              <button
                onClick={() => handleTabChange("membership")}
                className={`typo-semibold-14 flex-1 px-4 py-3 text-center transition-colors md:px-6 md:py-4 md:text-base ${
                  activeTab === "membership"
                    ? "border-b-2 border-white text-white"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <Crown size={16} className="mr-1 inline-block md:mr-2 md:size-5" />
                나의 멤버십
              </button>
            </nav>
          </div>

          <div className="p-4 md:p-8">
            {activeTab === "orders" && <OrdersTab orders={orders} />}
            {activeTab === "membership" && <MembershipTab user={user} />}
          </div>
        </div>

        {/* 사업자 등록 섹션 */}
        <BusinessRegistrationSection businessApplicationOverview={businessApplicationOverview} />
        {/* FAQ Section */}
        <FaqSection />
      </div>
    </div>
  );
}
