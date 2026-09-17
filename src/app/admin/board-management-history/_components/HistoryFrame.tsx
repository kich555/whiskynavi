"use client";

import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import type { ReactNode } from "react";

export default function HistoryFrame({ children, title = "게시판 관리기록" }: { children: ReactNode; title?: string }) {
  const { toggle } = useSidebar();
  return (
    <>
      <AdminHeader title={title} onToggleSidebar={toggle} showSearch={false} />
      <div className="p-4 md:p-8">{children}</div>
    </>
  );
}
