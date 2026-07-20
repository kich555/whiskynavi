import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";

describe("ApiError", () => {
  it("구조화된 오류 응답의 code, message, hint, requestId를 보존한다", () => {
    const error = new ApiError(
      404,
      JSON.stringify({
        code: "BUSINESS_APPLICATION_NOT_FOUND",
        message: "요청한 사업자 등록 신청을 찾을 수 없습니다.",
        hint: "신청 내역을 새로고침해 주세요.",
        requestId: "request-123",
      }),
    );

    expect(error.status).toBe(404);
    expect(error.code).toBe("BUSINESS_APPLICATION_NOT_FOUND");
    expect(error.userMessage).toBe("요청한 사업자 등록 신청을 찾을 수 없습니다.");
    expect(error.hint).toBe("신청 내역을 새로고침해 주세요.");
    expect(error.requestId).toBe("request-123");
  });

  it("구버전 error 필드 응답도 계속 사용자 메시지로 처리한다", () => {
    const error = new ApiError(400, JSON.stringify({ error: "이미 처리된 요청입니다." }));

    expect(error.userMessage).toBe("이미 처리된 요청입니다.");
    expect(error.code).toBeUndefined();
    expect(error.hint).toBeUndefined();
  });
});
