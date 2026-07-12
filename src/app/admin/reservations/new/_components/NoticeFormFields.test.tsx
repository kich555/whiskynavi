import type { AdminBottleReservationNoticeResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NoticeFormFields from "./NoticeFormFields";

describe("NoticeFormFields", () => {
  it("제출 실패 후 반환된 입력값을 기본값으로 렌더링한다", () => {
    const { container } = render(
      <NoticeFormFields
        formValues={{
          bottleId: "11",
          bottleName: "테스트 보틀",
          price: "120000",
          availableQuantity: "20",
          maxOrderQuantity: "2",
          reservationStartAt: "2026-06-08T10:00:00.000Z",
          reservationEndAt: "2026-06-08T12:00:00.000Z",
          description: "테스트 설명",
          gradeConditions: [
            {
              applicableFrom: "2026-06-08T10:00:00.000Z",
              requiredRole: "ROLE_USER",
            },
          ],
        }}
      />,
    );

    expect(screen.getByDisplayValue("테스트 보틀 (ID: 11)")).toBeInTheDocument();
    expect(screen.getByDisplayValue("테스트 설명")).toBeInTheDocument();
    expect(screen.getByDisplayValue("120,000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
    expect(container.querySelector<HTMLInputElement>('input[name="reservationStartAt"]')?.value).toBe(
      "2026-06-08T10:00:00.000Z",
    );
    expect(container.querySelector<HTMLInputElement>('input[name="reservationEndAt"]')?.value).toBe(
      "2026-06-08T12:00:00.000Z",
    );
    expect(container.querySelector<HTMLInputElement>('input[name="gradeConditions"]')?.value).toBe(
      JSON.stringify([
        {
          applicableFrom: "2026-06-08T10:00:00.000Z",
          requiredRole: "ROLE_USER",
        },
      ]),
    );
  });

  it("기존 공고 편집에서는 잔여 수락 수량 입력임을 표시한다", () => {
    const notice = {
      id: 7,
      availableQuantity: 4,
      approvedQuantity: 3,
    } satisfies AdminBottleReservationNoticeResponse;

    render(<NoticeFormFields defaultValues={notice} />);

    expect(screen.getByText("남은 수락 수량")).toBeInTheDocument();
    expect(screen.getByText("현재 수락한 수량 3병")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4")).toBeInTheDocument();
  });
});
