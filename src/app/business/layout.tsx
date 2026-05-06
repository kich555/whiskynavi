import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import BusinessSidebar from "./_components/BusinessSidebar";
import BusinessUnauthorizedPage from "./_components/BusinessUnauthorizedPage";

export const metadata = {
  title: "픽업 사업장",
  description: "픽업 예약 관리",
};

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    redirect("/sign-in");
  }

  if (!session.user.roles?.includes("ROLE_BUSINESS")) {
    return <BusinessUnauthorizedPage />;
  }

  return (
    <main className="flex min-h-screen bg-gray-50">
      <BusinessSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </main>
  );
}
