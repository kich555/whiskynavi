import { Award, Briefcase, Calendar, MessageSquare, Package, Users } from "lucide-react";
import { getStats } from "../_lib/getStats";

export default async function DashboardStats() {
  const stats = await getStats();

  const items = [
    {
      label: "전체 회원",
      value: stats.totalUsers,
      icon: Users,
      color: "text-gray-700",
      valueColor: "text-gray-900",
    },
    {
      label: "총 주문",
      value: stats.totalOrders,
      icon: Package,
      color: "text-gray-700",
      valueColor: "text-gray-900",
    },
    {
      label: "등록 제품",
      value: stats.totalBottles,
      icon: Package,
      color: "text-green-500",
      valueColor: "text-green-600",
    },
    {
      label: "예약 공고",
      value: stats.totalNotices,
      icon: Calendar,
      color: "text-amber-500",
      valueColor: "text-amber-600",
    },
    {
      label: "예약 신청",
      value: stats.totalApplications,
      icon: Award,
      color: "text-purple-500",
      valueColor: "text-purple-600",
    },
    {
      label: "사업자 회원",
      value: stats.totalBusinessMembers,
      icon: Briefcase,
      color: "text-blue-500",
      valueColor: "text-blue-600",
    },
    {
      label: "미응답 문의",
      value: stats.totalUnansweredInquiries,
      icon: MessageSquare,
      color: "text-red-500",
      valueColor: "text-red-600",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="typo-medium-14 text-gray-500">{item.label}</h3>
              <Icon size={20} className={item.color} />
            </div>
            <p className={`typo-bold-30 ${item.valueColor}`}>{item.value?.toLocaleString() ?? "-"}</p>
          </div>
        );
      })}
    </div>
  );
}
