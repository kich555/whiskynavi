export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "datetime-local" | "date" | "checkbox" | "select" | "file";
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  options?: { value: string; label: string }[];
  hint?: string;
  multiple?: boolean;
};
const text = (name: string, label: string, required = true, maxLength = 200): Field => ({
  name,
  label,
  required,
  maxLength,
});
const number = (name: string, label: string, required = true, min = 1): Field => ({
  name,
  label,
  type: "number",
  required,
  min,
});
const check = (name: string, label: string): Field => ({ name, label, type: "checkbox" });
const select = (name: string, label: string, options: [string, string][]): Field => ({
  name,
  label,
  type: "select",
  required: true,
  options: options.map(([value, label]) => ({ value, label })),
});
const reason = text("reason", "처리 사유", true, 500);
const memo = { ...text("adminMemo", "관리자 메모", false, 4000), type: "textarea" as const };
const bottle: Field[] = [
  text("name", "보틀명"),
  text("brand", "브랜드", false),
  text("series", "시리즈", false),
  text("distillery", "증류소", false),
  text("caskType", "캐스크 종류", false),
  text("caskNumber", "캐스크 번호", false),
  { ...number("abv", "도수 (%)", false, 0), max: 100 },
  { name: "distilledOn", label: "증류일", type: "date" },
  { name: "bottledOn", label: "병입일", type: "date" },
];
const notice: Field[] = [
  text("title", "공고 제목"),
  { ...text("description", "공고 내용", true, 20000), type: "textarea" },
  ...[
    ["applyOpenAt", "신청 시작"],
    ["applyCloseAt", "신청 마감"],
    ["reviewDeadlineAt", "리뷰 마감"],
  ].map(([name, label]) => ({ name, label: label + " (한국 시간)", type: "datetime-local" as const, required: true })),
];
const restriction: Field[] = [
  number("durationDays", "제한 기간 (일)"),
  text("userReason", "사용자에게 표시할 사유", true, 500),
  { ...text("internalNote", "내부 메모", false, 4000), type: "textarea" },
];
export const operationFields = {
  createBottle: bottle,
  editBottle: [...bottle, reason],
  importBottle: [number("saleBottleId", "기존 판매 보틀 ID")],
  linkBottle: [number("saleBottleId", "기존 판매 보틀 ID"), number("reviewBottleId", "연결할 리뷰 보틀 ID"), reason],
  publishBottle: [],
  uploadImage: [{ name: "file", label: "보틀 이미지", type: "file", required: true }] as Field[],
  createSample: [text("name", "샘플명"), number("reviewBottleId", "리뷰 보틀"), memo, check("active", "사용 가능")],
  editSample: [text("name", "샘플명"), number("reviewBottleId", "리뷰 보틀"), memo, check("active", "사용 가능")],
  createNotice: notice,
  editNotice: notice,
  publishNotice: [],
  cancelNotice: [reason],
  extend: [
    { name: "deadline", label: "새 리뷰 마감 (한국 시간)", type: "datetime-local", required: true },
    reason,
  ] as Field[],
  addSample: [number("sampleId", "샘플"), number("offeredQuantity", "배분 가능 수량", true, 0)],
  editNoticeSample: [
    number("offeredQuantity", "배분 가능 수량", true, 0),
    text("blindCode", "블라인드 코드", true, 32),
  ],
  unlinkSample: [reason],
  manual: [
    number("applicationId", "신청자"),
    { name: "noticeSampleIds", label: "배분 샘플", type: "select", multiple: true, required: true },
    reason,
  ] as Field[],
  auto: [
    {
      ...number("targetTotalPerUser", "1인당 목표 총 샘플 수"),
      max: 10000,
      hint: "기존 수동·자동 배분을 포함한 총개수입니다. 신청 순서대로 부족한 수량 전체를 채울 수 있을 때만 랜덤 배분합니다.",
    },
  ],
  confirm: [],
  revoke: [reason],
  address: [
    text("receiverName", "수령인", true, 100),
    text("receiverPhone", "연락처", true, 20),
    text("postalCode", "우편번호", true, 20),
    text("address", "주소", true, 500),
    text("addressDetail", "상세 주소", true, 500),
    reason,
  ],
  prepare: [
    number("applicationId", "신청자"),
    { name: "allocationIds", label: "배송할 배분 샘플", type: "select", multiple: true, required: true },
    number("previousShipmentId", "이전 배송 ID (재배송만)", false),
  ] as Field[],
  dispatch: [text("carrier", "택배사", true, 100), text("trackingNumber", "송장 번호", true, 100)],
  delivered: [reason],
  tracking: [],
  resolve: [check("reship", "재배송 필요"), reason],
  complete: [
    number("allocationId", "배분 샘플 ID (비우면 신청 전체)", false),
    select("actionType", "처리 방식", [
      ["COMPLETE", "수동 완료"],
      ["EXEMPT", "작성 면제"],
    ]),
    reason,
  ],
  correct: [reason],
  restrict: [
    number("userId", "회원 ID"),
    number("applicationId", "신청 ID (미작성 제한은 필수)", false),
    select("reasonType", "제한 사유", [
      ["ABUSE", "악용"],
      ["NON_SUBMISSION", "미작성"],
      ["OTHER", "기타"],
    ]),
    ...restriction,
  ],
  restrictionEdit: [...restriction, reason],
  revokeRestriction: [reason],
  annotate: [
    text("tags", "태그 (쉼표로 구분)", false, 4000),
    { ...text("memo", "정리 메모", false, 4000), type: "textarea" },
    check("starred", "중요 리뷰"),
    check("read", "검토 완료"),
  ] as Field[],
  moderate: [
    check("hidden", "리뷰 숨김"),
    check("includeHiddenInStatistics", "숨긴 리뷰를 통계에 포함"),
    text("userReason", "사용자에게 표시할 사유", false, 500),
    { ...text("internalNote", "내부 메모", false, 4000), type: "textarea" },
  ] as Field[],
  reveal: [reason],
  hide: [reason],
  export: [
    select("format", "파일 형식", [
      ["CSV", "CSV"],
      ["XLSX", "Excel (XLSX)"],
    ]),
    select("authorMode", "작성자 표시", [
      ["ANONYMOUS", "회차 내 익명 별칭"],
      ["NICKNAME", "닉네임"],
    ]),
    check("includeHidden", "숨긴 리뷰 포함"),
    check("includePostReveal", "정체 공개 후 제출 포함"),
  ],
} satisfies Record<string, Field[]>;
export type Operation = keyof typeof operationFields;
export function koreaInput(value?: string) {
  return value ? new Date(new Date(value).getTime() + 9 * 3600000).toISOString().slice(0, 16) : "";
}
export function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "short" }).format(
        new Date(value),
      )
    : "—";
}
export const labels: Record<string, string> = {
  DRAFT: "준비",
  PUBLISHED: "모집 공고",
  FULFILLMENT: "배송·리뷰 진행",
  CANCELLED: "취소",
  PRIVATE: "비공개",
  PUBLIC: "공개",
  APPLIED: "신청",
  PARTICIPATING: "참여",
  UNALLOCATED: "미배분",
  CONFIRMED: "배분 확정",
  REVOKED: "회수·해제",
  PREPARED: "배송 준비",
  DISPATCHED: "발송",
  DELIVERED: "배송 완료",
  OPEN: "접수",
  RESOLVED: "해결",
  ACTIVE: "활성",
  RELEASED: "해제",
  EXPIRED: "만료",
  SUBMITTED: "제출 완료",
  ON_TIME: "기한 내 제출",
  LATE_PRE_REVEAL: "지연 제출",
  POST_REVEAL: "공개 후 제출",
  ABUSE: "악용",
  NON_SUBMISSION: "미작성",
  OTHER: "기타",
  COMPLETE: "수동 완료",
  EXEMPT: "면제",
  MANUAL: "수동",
  AUTO: "자동",
  CLOSED: "작성 불가",
  READY: "작성 가능",
  WAIT_DELIVERY: "배송 대기",
  WAIT_REDELIVERY: "재배송 대기",
  INCIDENT_BLOCKED: "사고 처리 중",
};
