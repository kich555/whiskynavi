import { describe, expect, it } from "vitest";
import { getPastedUrl } from "./pasted-url";

function clipboardData(data: Record<string, string>) {
  return {
    getData: (type: string) => data[type] ?? "",
  };
}

describe("getPastedUrl", () => {
  it("reads the URL from a URI list when plain text is a link title", () => {
    const result = getPastedUrl(
      clipboardData({
        "text/plain": "위스키 뉴스",
        "text/uri-list": "# copied link\nhttps://example.com/news?id=1",
      }),
    );

    expect(result).toBe("https://example.com/news?id=1");
  });

  it("reads the href when a single rich-text link was copied", () => {
    const result = getPastedUrl(
      clipboardData({
        "text/plain": "위스키 뉴스",
        "text/html": '<a href="https://example.com/news?id=1">위스키 뉴스</a>',
      }),
    );

    expect(result).toBe("https://example.com/news?id=1");
  });

  it("preserves normal rich text that merely contains a link", () => {
    const result = getPastedUrl(
      clipboardData({
        "text/plain": "자세한 내용은 위스키 뉴스를 확인하세요.",
        "text/html": '<p>자세한 내용은 <a href="https://example.com/news">위스키 뉴스</a>를 확인하세요.</p>',
      }),
    );

    expect(result).toBeNull();
  });

  it("leaves a plain URL to TipTap's default paste handling", () => {
    const result = getPastedUrl(
      clipboardData({
        "text/plain": "https://example.com/news",
        "text/html": '<a href="https://example.com/news">https://example.com/news</a>',
      }),
    );

    expect(result).toBeNull();
  });

  it("rejects unsafe link protocols", () => {
    const result = getPastedUrl(
      clipboardData({
        "text/plain": "링크",
        "text/html": '<a href="javascript:alert(1)">링크</a>',
      }),
    );

    expect(result).toBeNull();
  });
});
