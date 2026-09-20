"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
export default function RefreshEntitlementsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="typo-medium-14 rounded border border-gray-300 px-4 py-3 disabled:opacity-50"
    >
      {pending ? "조회 중…" : "새로고침"}
    </button>
  );
}
