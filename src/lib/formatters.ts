export function formatCurrency(value?: number | null): string {
  if (value == null) return "-";
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr)
    .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
