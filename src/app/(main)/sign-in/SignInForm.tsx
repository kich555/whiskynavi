"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 클라이언트 유효성 검사
    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      setIsPending(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식이 아닙니다.");
      setIsPending(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (result?.ok) {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <form onSubmit={handleCredentialsSubmit} className="w-full">
        {/* Email Input */}
        <div className="mt-6 w-full">
          <Label htmlFor="email" className="typo-medium-13 block font-semibold text-white">
            이메일 주소
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ex) whiskynavi@whiskynavi.com"
            required
            className="typo-medium-13 mt-2 rounded-none border-0 border-b border-gray-200 bg-transparent px-0 py-3 font-semibold text-white placeholder:text-gray-200 focus-visible:border-white focus-visible:ring-0"
          />
        </div>

        {/* Password Input */}
        <div className="mt-6 w-full">
          <Label htmlFor="password" className="typo-medium-13 block font-semibold text-white">
            비밀번호
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="typo-medium-13 mt-2 rounded-none border-0 border-b border-gray-200 bg-transparent px-0 py-3 font-semibold text-white placeholder:text-gray-200 focus-visible:border-white focus-visible:ring-0"
          />
        </div>

        {/* Error Message */}
        {error && <p className="typo-medium-14 mt-4 text-center text-red-400">{error}</p>}

        {/* Login Button */}
        <Button
          type="submit"
          variant="outline"
          disabled={isPending}
          className="mt-7 h-14 w-full cursor-pointer border border-white/30 bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <p className="typo-medium-16 font-semibold text-black">{isPending ? "로그인 중..." : "로그인"}</p>
        </Button>
      </form>
      <div className="mt-5 flex w-full items-center justify-center gap-14">
        <Link href="/sign-up" className="typo-medium-16 min-w-25 text-center font-semibold text-[#FFF]">
          회원가입
        </Link>
        <span className="text-[#FFF]">|</span>
        <Link href="/find-password" className="typo-medium-16 min-w-25 text-center font-semibold text-[#FFF]">
          비밀번호 초기화
        </Link>
      </div>
    </>
  );
}
