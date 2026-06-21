// dev(api-ca01)에 생성된 게시판 id=2, prod(api.whiskynavi)에 생성된 게시판 id=1
// 로컬 개발은 api-ca01을 바라보므로 기본값 2
// 프로덕션 배포 시 NEXT_PUBLIC_COMMUNITY_BOARD_ID=1 로 .env 설정 필요
export const COMMUNITY_BOARD_ID = Number(process.env.NEXT_PUBLIC_COMMUNITY_BOARD_ID ?? 2);
export const POSTS_PER_PAGE = 10;
export const LOAD_MORE_MAX_CLICKS = 5;
export const MAX_IMAGE_COUNT = 5;
export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PINNED_ANNOUNCEMENT_COUNT = 3;