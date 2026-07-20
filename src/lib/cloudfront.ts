/**
 * CloudFront URL 빌드 헬퍼.
 *
 * NEXT_PUBLIC_CLOUDFRONT_DOMAIN 환경변수를 읽어서
 * 주어진 key(예: "prod/public/boards/xxx.jpg")와 결합해
 * 정규화된 CloudFront URL을 반환한다.
 *
 * 도메인 끝의 "/"와 key 앞의 "/"를 제거한 뒤 단일 "/"로 이음 —
 * "https://file.whiskynavi.com/" + "/prod/public/x.jpg" 같은 입력도
 * "https://file.whiskynavi.com/prod/public/x.jpg"로 정규화된다.
 *
 * 환경변수가 없으면 명시적으로 에러를 던진다.
 * (개발 편의를 위한 빈 문자열 fallback은 의도치 않은 잘못된 URL 생성 위험이 있어 제외)
 */

const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;

export function buildCloudFrontUrl(key: string): string {
  if (!CLOUDFRONT_DOMAIN) {
    throw new Error(
      "NEXT_PUBLIC_CLOUDFRONT_DOMAIN 환경변수가 설정되지 않았습니다.",
    );
  }

  const normalizedDomain = CLOUDFRONT_DOMAIN.replace(/\/+$/, "");
  const normalizedKey = key.replace(/^\/+/, "");

  return `${normalizedDomain}/${normalizedKey}`;
}
