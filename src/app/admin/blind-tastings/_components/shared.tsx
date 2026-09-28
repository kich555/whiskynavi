"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import { labels } from "../fields";
export const buttonClass =
  "typo-medium-14 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";
export const inputClass =
  "typo-regular-14 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 leading-relaxed focus:outline-amber-600";
export function Shell({ title, children }: { title: string; children: ReactNode }) {
  const { toggle } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  return (
    <>
      <AdminHeader title={title} onToggleSidebar={toggle} showSearch={false} />
      <div className="w-full space-y-6 p-4 lg:p-8">
        <nav aria-label="블라인드 관리" className="flex flex-wrap gap-2">
          {[
            ["", "회차 관리"],
            ["bottles", "리뷰 보틀"],
            ["samples", "샘플"],
            ["restrictions", "참여 제한"],
            ["incidents", "배송 사고"],
          ].map(([path, label]) => (
            <Link
              key={path}
              href={`/admin/blind-tastings${path ? `/${path}` : ""}`}
              className={`${buttonClass} ${path ? (pathname.endsWith(path) ? "border-amber-600 bg-amber-50" : "") : pathname.includes("notices") || pathname.endsWith("blind-tastings") ? "border-amber-600 bg-amber-50" : ""}`}
            >
              {label}
            </Link>
          ))}
          <button
            type="button"
            className={buttonClass}
            disabled={refreshing}
            onClick={() => startRefresh(() => router.refresh())}
          >
            {refreshing ? "불러오는 중…" : "새로고침"}
          </button>
        </nav>
        {children}
      </div>
    </>
  );
}
export function Badge({ value }: { value?: string }) {
  return (
    <span
      className={`typo-medium-12 inline-block rounded-full px-2 py-1 whitespace-nowrap ${value === "PUBLIC" || value === "DELIVERED" || value === "SUBMITTED" ? "bg-green-50 text-green-800" : value === "CANCELLED" || value === "REVOKED" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-700"}`}
    >
      {labels[value ?? ""] ?? value ?? "—"}
    </span>
  );
}
export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-4 rounded-xl border border-gray-200 bg-white p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="typo-bold-18">{title}</h2>
          {description && <p className="typo-regular-14 mt-2 max-w-4xl leading-relaxed text-gray-600">{description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      {children}
    </section>
  );
}
export function DataTable({ headers, children, empty }: { headers: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
      <table className="typo-regular-14 w-full min-w-[720px] text-left leading-relaxed">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            {headers.map((h) => (
              <th scope="col" key={h} className="px-4 py-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 [&_td]:px-4 [&_td]:py-3 [&_td]:align-top">
          {empty ? (
            <tr>
              <td colSpan={headers.length} className="py-12 text-center text-gray-500">
                표시할 내역이 없습니다.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
export function ErrorPanel({ error }: { error: string }) {
  const router = useRouter();
  return (
    <div role="alert" className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6">
      <p>{error}</p>
      <button className={buttonClass} onClick={() => router.refresh()}>
        다시 불러오기
      </button>
      <Link className={`${buttonClass} ml-2`} href="/sign-in">
        다시 로그인
      </Link>
    </div>
  );
}
export function RawJson({ value }: { value?: string }) {
  return (
    <pre className="typo-regular-13 max-h-80 max-w-full overflow-auto rounded-lg bg-gray-50 p-4 leading-relaxed break-all whitespace-pre-wrap">
      {value || "내용 없음"}
    </pre>
  );
}
