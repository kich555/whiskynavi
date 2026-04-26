"use client";

import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BusinessUnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 rounded-full bg-red-100 p-4">
          <ShieldX className="size-12 text-red-600" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-white">접근 권한이 없습니다</h1>

        <p className="mb-8 max-w-md text-white">픽업 사업장 계정으로 로그인해야 이용할 수 있습니다.</p>

        <Button onClick={() => router.push("/")} className="gap-2">
          메인 페이지로 돌아가기
        </Button>
      </div>
    </div>
  );
}
