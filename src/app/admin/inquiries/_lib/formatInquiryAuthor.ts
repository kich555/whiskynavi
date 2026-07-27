import type { AdminInquiryMessageResponse } from "@/apis/generated/api";

type InquiryAuthor = Pick<AdminInquiryMessageResponse, "authorId" | "authorNickname" | "authorType"> & {
  authorName?: string;
};

export function formatInquiryAuthor(author: InquiryAuthor): string {
  const name = author.authorName?.trim();
  const nickname = author.authorNickname?.trim();

  if (name && nickname) {
    return `${name}(${nickname})`;
  }

  if (name) {
    return name;
  }

  if (nickname) {
    return nickname;
  }

  return author.authorType === "ADMIN" ? `관리자 #${author.authorId}` : `사용자 #${author.authorId}`;
}
