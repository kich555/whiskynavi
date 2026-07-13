import { describe, expect, it } from "vitest";
import { richTextHasContent, richTextHasImage, sanitizeRichTextContent } from "./rich-text";

describe("rich text helpers", () => {
  it("안전한 이미지와 서식은 유지하고 실행 가능한 HTML은 제거한다", () => {
    const result = sanitizeRichTextContent(
      '<p>문의</p><img src="https://cdn.example.com/image.png" onerror="alert(1)"><script>alert(1)</script>',
    );

    expect(result).toBe('<p>문의</p><img src="https://cdn.example.com/image.png" />');
  });

  it("blob 이미지와 javascript 링크를 허용하지 않는다", () => {
    const result = sanitizeRichTextContent(
      '<img src="blob:https://example.com/1"><a href="javascript:alert(1)">링크</a>',
    );

    expect(result).toBe("<img /><a>링크</a>");
  });

  it("HTML 엔티티로 인코딩된 이미지 본문을 렌더링 가능한 HTML로 복원한다", () => {
    const result = sanitizeRichTextContent(
      "&lt;p&gt;첨부 이미지&lt;/p&gt;&lt;img src=&quot;https://cdn.example.com/image.png&quot; onerror=&quot;alert(1)&quot;&gt;",
    );

    expect(result).toBe('<p>첨부 이미지</p><img src="https://cdn.example.com/image.png" />');
  });

  it("이미지만 있는 본문도 유효한 내용으로 판단한다", () => {
    const content = '<p></p><img src="https://cdn.example.com/image.png">';

    expect(richTextHasContent(content)).toBe(true);
    expect(richTextHasImage(content)).toBe(true);
    expect(richTextHasContent("<p><br></p>")).toBe(false);
  });
});
