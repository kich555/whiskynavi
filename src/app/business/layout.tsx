import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "픽업 사업장",
  description: "픽업 예약 관리",
};

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    redirect("/sign-in");
  }

  return <main className="min-h-screen bg-gray-50">{children}</main>;
}
