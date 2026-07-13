import type { CreatePostRequest } from "@/apis/generated/api";
import sanitizeHtml from "sanitize-html";

interface PostPayloadInput {
  title: string;
  content: string;
  postTypeCode: string;
}

export function sanitizePostContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height"],
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https"],
  });
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
