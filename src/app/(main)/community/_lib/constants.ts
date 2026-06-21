export const COMMUNITY_BOARD_ID = Number(process.env.NEXT_PUBLIC_COMMUNITY_BOARD_ID ?? 1);
export const POSTS_PER_PAGE = 10;
export const LOAD_MORE_MAX_CLICKS = 5;
export const MAX_IMAGE_COUNT = 5;
export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PINNED_ANNOUNCEMENT_COUNT = 3;