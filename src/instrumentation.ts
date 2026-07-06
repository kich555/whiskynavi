// 백엔드가 내려주는 날짜 문자열은 타임존 오프셋 없이 KST 기준으로 고정되어 있다.
// Vercel 등 배포 환경은 기본적으로 UTC로 동작해 naive Date 파싱 시 9시간 오차가 나므로,
// 서버 프로세스 자체를 KST로 고정해 이중 안전망을 둔다(1차 방어는 utils.ts의 parseNoticeDateTime).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = "Asia/Seoul";
  }
}
