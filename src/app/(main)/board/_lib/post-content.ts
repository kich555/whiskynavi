import type { CreatePostRequest } from "@/apis/generated/api";
import sanitizeHtml from "sanitize-html";

interface PostPayloadInput {
  title: string;
  content: string;
  postTypeCode: string;
}

export function sanitizePostContent(content: string): string {
  const sanitized = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height"],
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https"],
  });

  // TipTap은 빈 줄을 <p></p>로 직렬화한다. <br />를 넣어 HTML 뷰에서도
  // 문단이 높이를 가지도록 하여 사용자가 입력한 연속 빈 줄을 보존한다.
  return sanitized.replace(/<p>\s*<\/p>/gi, "<p><br /></p>");
}

export function buildPostPayload(input: PostPayloadInput): CreatePostRequest {
  const content = sanitizePostContent(input.content);

  return {
    title: input.title,
    content,
    postTypeCode: input.postTypeCode,
    hasImage: /<img\b/i.test(content),
  };
}
