import { cache } from "react";

import { getApiV2AdminDashboardStats } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";

export type AdminDashboardStats = {
  totalUsers: number | null;
  totalOrders: number | null;
  totalBottles: number | null;
  totalNotices: number | null;
  totalApplications: number | null;
  totalBusinessMembers: number | null;
  totalUnansweredInquiries: number | null;
};

const EMPTY_STATS: AdminDashboardStats = {
  totalUsers: null,
  totalOrders: null,
  totalBottles: null,
  totalNotices: null,
  totalApplications: null,
  totalBusinessMembers: null,
  totalUnansweredInquiries: null,
};

export const getStats = cache(async (): Promise<AdminDashboardStats> => {
  try {
    const token = await getAuthToken();
    const response = await getApiV2AdminDashboardStats(withToken(token));
    return response.data;
  } catch {
    return EMPTY_STATS;
  }
});
