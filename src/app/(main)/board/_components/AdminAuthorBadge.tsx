import { ShieldCheck } from "lucide-react";

interface AdminAuthorBadgeProps {
  variant?: "icon" | "label";
}

export default function AdminAuthorBadge({ variant = "label" }: AdminAuthorBadgeProps) {
  return (
    <span
      aria-label="관리자 작성자"
      title="관리자 작성자"
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-amber-400"
    >
      <ShieldCheck aria-hidden="true" className="size-3" />
      {variant === "label" ? <span>관리자</span> : null}
    </span>
  );
}
