import { getGetApiAdminBottlesReservationsNoticesNoticeidAllocationExcelUrl } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/page-response";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.whiskynavi.com";

/**
 * 관리자 예약 공고 할당 Excel 다운로드 프록시.
 *
 * 브라우저에서 백엔드 URL을 직접 열면 Authorization 헤더를 붙일 수 없으므로,
 * 현재 NextAuth 세션의 access token으로 백엔드 파일 응답을 대신 받아 전달한다.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ noticeId: string }> }) {
  const { noticeId: noticeIdParam } = await params;
  const noticeId = parsePositiveInt(noticeIdParam);
  if (!noticeId) {
    return new Response("유효한 예약 공고 ID가 아닙니다.", { status: 400 });
  }

  const token = await getAuthToken();

  if (!token) {
    return new Response("인증이 필요합니다.", { status: 401 });
  }

  const upstreamUrl = `${API_BASE_URL}${getGetApiAdminBottlesReservationsNoticesNoticeidAllocationExcelUrl(noticeId)}`;
  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return new Response("엑셀 다운로드 서버에 연결할 수 없습니다.", { status: 502 });
  }

  if (!upstreamResponse.ok) {
    const message = await upstreamResponse.text().catch(() => "엑셀 다운로드에 실패했습니다.");
    return new Response(message || "엑셀 다운로드에 실패했습니다.", { status: upstreamResponse.status });
  }

  const headers = new Headers(upstreamResponse.headers);

  headers.set("Cache-Control", "no-store");
  headers.delete("Content-Encoding");
  headers.delete("Content-Length");
  headers.delete("Transfer-Encoding");

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  if (!headers.has("Content-Disposition")) {
    headers.set("Content-Disposition", `attachment; filename="bottle-reservation-allocation-${noticeId}.xlsx"`);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}
