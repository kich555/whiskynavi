import { ROLE_LABEL_MAP } from "@/app/admin/constants";
import { z } from "zod/v4";

const numberField = (label: string, minimum: number, integer = true) =>
  z
    .string()
    .trim()
    .min(1, `${label}을 입력해 주세요.`)
    .transform(Number)
    .pipe(
      integer
        ? z.number().int(`${label}은 정수로 입력해 주세요.`).min(minimum, `${label}은 ${minimum} 이상이어야 합니다.`)
        : z.number().min(minimum, `${label}은 ${minimum} 이상이어야 합니다.`),
    );
const optionalNumber = z.preprocess(
  (value) => (value === "" ? undefined : value),
  numberField("최대 주문 수량", 1).optional(),
);
const optionalDate = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.iso.datetime({ local: true }).optional(),
);

const schema = z
  .object({
    title: z.string().trim().min(1, "제목을 입력해 주세요.").max(200, "제목은 200자 이내로 입력해 주세요."),
    salePrice: numberField("판매가", 0, false),
    saleStatus: z.enum(["DRAFT", "OPEN", "CLOSED", "SOLD_OUT"]),
    maxOrderQuantity: optionalNumber,
    saleStartAt: optionalDate,
    saleEndAt: optionalDate,
    orderableRoles: z.array(
      z.string().refine((role) => Object.hasOwn(ROLE_LABEL_MAP, role), "주문 가능 역할을 확인해 주세요."),
    ),
    totalQuantity: numberField("총 판매 수량", 1).optional(),
    availableQuantity: numberField("판매 가능 수량", 0).optional(),
    expectedAvailableQuantity: numberField("조회 시 판매 가능 수량", 0).optional(),
    stockAdjustmentReason: z
      .string()
      .trim()
      .min(1, "재고 조정 사유를 입력해 주세요.")
      .max(200, "재고 조정 사유는 200자 이내로 입력해 주세요.")
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.saleStartAt && value.saleEndAt && value.saleStartAt >= value.saleEndAt)
      ctx.addIssue({ code: "custom", message: "판매 종료 시각은 시작 시각 이후여야 합니다." });
    if (value.totalQuantity != null && value.availableQuantity != null && value.availableQuantity > value.totalQuantity)
      ctx.addIssue({ code: "custom", message: "판매 가능 수량은 총 판매 수량을 초과할 수 없습니다." });
  });

export function parseSaleUpdate(formData: FormData) {
  const stock = formData.get("adjustStock") === "on";
  return schema.safeParse({
    title: formData.get("title"),
    salePrice: formData.get("salePrice"),
    saleStatus: formData.get("saleStatus"),
    maxOrderQuantity: formData.get("maxOrderQuantity") ?? "",
    saleStartAt: formData.get("saleStartAt") ?? "",
    saleEndAt: formData.get("saleEndAt") ?? "",
    orderableRoles: formData.getAll("orderableRoles"),
    ...(stock
      ? {
          totalQuantity: formData.get("totalQuantity"),
          availableQuantity: formData.get("availableQuantity"),
          expectedAvailableQuantity: formData.get("expectedAvailableQuantity"),
          stockAdjustmentReason: formData.get("stockAdjustmentReason"),
        }
      : {}),
  });
}
