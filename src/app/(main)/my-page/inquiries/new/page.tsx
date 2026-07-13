import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/auth";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import InquiryCreateForm from "../_components/InquiryCreateForm";

export default async function NewInquiryPage() {
  const token = await getAuthToken();
  if (!token) redirect("/sign-in?callbackUrl=/my-page/inquiries/new");

  return (
    <div className="mt-20 min-h-screen bg-[#1d2429] px-4 py-8 sm:mt-16 sm:px-6 md:py-12 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Button asChild variant="ghost" className="mb-5 px-0 text-gray-400 hover:text-white">
          <Link href="/my-page/inquiries">
            <ChevronLeft /> 문의 목록으로
          </Link>
        </Button>
        <div className="border border-white/10 bg-white/5 p-5 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white md:text-3xl">1:1 문의하기</h1>
            <p className="mt-2 text-sm text-gray-400">문의 내용을 확인한 후 답변드리겠습니다.</p>
          </div>
          <InquiryCreateForm />
        </div>
      </div>
    </div>
  );
}
