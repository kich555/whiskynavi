// 개인정보 원문 대신 요청 지문과 멱등 키만 탭 세션에 보관한다.
export type CheckoutAttempt = { fingerprint: string; key: string };
const PREFIX = "wn_cart_checkout_v1:";

export async function getCheckoutAttempt(
  requestIdentity: unknown,
  previous: CheckoutAttempt | null,
): Promise<CheckoutAttempt> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(requestIdentity)));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (previous?.fingerprint === fingerprint) return previous;

  let storedKey: string | null = null;
  try {
    storedKey = sessionStorage.getItem(PREFIX + fingerprint);
  } catch {
    // 저장소가 차단되어도 같은 화면 안의 재시도는 ref로 유지한다.
  }
  const key = storedKey && /^[0-9a-f-]{36}$/i.test(storedKey) ? storedKey : crypto.randomUUID();
  try {
    sessionStorage.setItem(PREFIX + fingerprint, key);
  } catch {
    // 저장소 오류로 결제를 막지 않는다.
  }
  return { fingerprint, key };
}

export function forgetCheckoutAttempt(attempt: CheckoutAttempt) {
  try {
    sessionStorage.removeItem(PREFIX + attempt.fingerprint);
  } catch {
    // 다음 시도에서는 화면의 ref도 초기화한다.
  }
}
