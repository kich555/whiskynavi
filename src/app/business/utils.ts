export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
};

export const formatCurrency = (amount?: number): string => {
  if (amount == null) return "-";
  return `${amount.toLocaleString("ko-KR")}원`;
};
