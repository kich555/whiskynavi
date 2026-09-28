import { customFetch } from "./mutator";
/** JSON과 파일 응답에 동일한 인증 갱신 경로를 사용합니다. */
export function blindTastingFetch<T>(url: string, options: RequestInit): Promise<T> {
  const binary = options.method === "GET" && /\/(download|image)$/.test(url);
  return customFetch<T>(url, options, binary);
}
