"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Home, RotateCcw, ShieldX } from "lucide-react";

interface AdminErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminErrorPage({ error, reset }: AdminErrorPageProps) {
  const router = useRouter();

  const isAuthError =
    error.message === "인증이 만료되었습니다. 다시 로그인해주세요." || error.digest?.includes("AUTH_ERROR") === true;

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Admin Error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 rounded-full bg-red-100 p-4">
          <ShieldX className="size-12 text-red-600" />
        </div>

        <h1 className="typo-bold-24 mb-2 text-gray-900">
          {isAuthError ? "접근 권한이 없습니다" : "오류가 발생했습니다"}
        </h1>

        <p className="mb-8 max-w-md text-gray-600">
          {isAuthError
            ? "이 페이지에 접근할 권한이 없습니다. 관리자 권한이 필요하거나 로그인이 필요할 수 있습니다."
            : "페이지를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => reset()} className="gap-2">
            <RotateCcw className="size-4" />
            다시 시도
          </Button>

          <Button onClick={() => router.push("/")} className="gap-2">
            <Home className="size-4" />
            홈으로 이동
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 w-full max-w-lg text-left">
            <summary className="typo-medium-14 cursor-pointer text-gray-500 hover:text-gray-700">
              오류 상세 정보 (개발 모드)
            </summary>
            <pre className="typo-medium-12 mt-2 overflow-auto rounded-lg bg-gray-100 p-4 text-gray-800">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
