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

export function formatDateTimeWithMilliseconds(dateStr?: string): string {
  if (!dateStr) return "-";

  const date = new Date(dateStr);
  const pad = (value: number, length = 2) => String(value).padStart(length, "0");

  return [
    `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`,
  ].join(" ");
}
