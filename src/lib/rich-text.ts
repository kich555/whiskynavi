import sanitizeHtml from "sanitize-html";

const ENCODED_RICH_TEXT_TAG = /&lt;\/?(?:a|blockquote|br|code|em|h1|h2|h3|img|li|ol|p|pre|strong|ul)(?:\s|&gt;)/i;

function decodeEncodedRichText(content: string): string {
  if (!ENCODED_RICH_TEXT_TAG.test(content)) return content;

  return content
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (reference, hex: string | undefined, decimal: string | undefined) => {
      const codePoint = Number.parseInt(hex ?? decimal ?? "", hex ? 16 : 10);
      if (codePoint < 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return reference;
      return String.fromCodePoint(codePoint);
    })
    .replace(/&quot;/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&amp;/gi, "&");
}

export function sanitizeRichTextContent(content: string): string {
  const sanitized = sanitizeHtml(decodeEncodedRichText(content), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height"],
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https"],
  });

  return sanitized.replace(/<p>\s*<\/p>/gi, "<p><br /></p>");
}

export function richTextHasImage(content: string): boolean {
  return /<img\b/i.test(content);
}

export function richTextHasContent(content: string): boolean {
  const sanitized = sanitizeRichTextContent(content);
  if (richTextHasImage(sanitized)) return true;

  return (
    sanitizeHtml(sanitized, { allowedTags: [], allowedAttributes: {} })
      .replace(/\u00a0/g, " ")
      .trim().length > 0
  );
}
