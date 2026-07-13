type ClipboardData = Pick<DataTransfer, "getData">;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getHttpUrl(value: string): string | null {
  const candidate = value.trim();

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? candidate : null;
  } catch {
    return null;
  }
}

/**
 * 링크 자체를 복사했을 때 클립보드에 담긴 실제 URL을 반환한다.
 *
 * 일부 사이트는 text/plain에는 링크 제목을, text/html의 href 또는
 * text/uri-list에는 실제 URL을 담는다. 일반 문장 안에 포함된 링크는
 * 기존의 rich-text 붙여넣기를 유지하기 위해 변환하지 않는다.
 */
export function getPastedUrl(clipboardData: ClipboardData): string | null {
  const uriListUrl = clipboardData
    .getData("text/uri-list")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));
  if (uriListUrl) return getHttpUrl(uriListUrl);

  const html = clipboardData.getData("text/html");
  const plainText = normalizeText(clipboardData.getData("text/plain"));
  if (!html || !plainText || getHttpUrl(plainText)) return null;

  const document = new DOMParser().parseFromString(html, "text/html");
  const anchors = document.body.querySelectorAll("a[href]");
  if (anchors.length !== 1) return null;

  const anchor = anchors[0];
  if (normalizeText(anchor.textContent ?? "") !== plainText) return null;

  return getHttpUrl(anchor.getAttribute("href") ?? "");
}
