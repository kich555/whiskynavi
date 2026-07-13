import type { CreatePostRequest } from "@/apis/generated/api";
import { richTextHasImage, sanitizeRichTextContent } from "@/lib/rich-text";

interface PostPayloadInput {
  title: string;
  content: string;
  postTypeCode: string;
}

export function sanitizePostContent(content: string): string {
  return sanitizeRichTextContent(content);
}

export function buildPostPayload(input: PostPayloadInput): CreatePostRequest {
  const content = sanitizePostContent(input.content);

  return {
    title: input.title,
    content,
    postTypeCode: input.postTypeCode,
    hasImage: richTextHasImage(content),
  };
}
