import { z } from "zod";

export const taxInvoiceEmailSchema = z
  .string()
  .trim()
  .max(254, "이메일은 254자 이하로 입력해주세요.")
  .refine((value) => value === "" || z.email().safeParse(value).success, {
    message: "올바른 세금계산서 수신 이메일을 입력해주세요.",
  });
