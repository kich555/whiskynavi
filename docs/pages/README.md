# 페이지 문서 인덱스

프론트엔드 라우트별 맥락 문서. 코드가 아닌 **사용자 가치/화면/기능/흐름** 중심.
컴포넌트명·라인번호는 graphify/codegraph가 실시간 제공하므로 여기엔 불필요.

## 목적

- 사람/에이전트 모두 해당 페이지를 열기 전 맥락 파악
- "이 라우트는 무엇을 보여주고 무엇을 하는가"를 자연어로
- 코드 구조는 graphify query/path로, 심볼은 codegraph로 보충

## 라우트 그룹

| 그룹 | 문서 | 대상 |
|---|---|---|
| admin | [admin/_index.md](./admin/_index.md) | `/admin` (대시보드 홈), 전체 `/admin/*` 인증 가드·에러 바운더리 |
| admin | [admin/reservations.md](./admin/reservations.md) | `/admin/reservations/*` |
| admin | [admin/products.md](./admin/products.md) | `/admin/products/*` |
| admin | [admin/users.md](./admin/users.md) | `/admin/users/*` |
| admin | [admin/banners.md](./admin/banners.md) | `/admin/banners/*` |
| admin | [admin/boards.md](./admin/boards.md) | `/admin/boards/*`, `/admin/board-management-history`, `/admin/post-restrictions` |
| admin | [admin/businesses.md](./admin/businesses.md) | `/admin/businesses/*` |
| admin | [admin/inquiries.md](./admin/inquiries.md) | `/admin/inquiries/*` |
| admin | [admin/general-items.md](./admin/general-items.md) | `/admin/general-items/*`, `/admin/general-item-sales/*`, `/admin/general-item-orders/*` |
| admin | [admin/bottle-orders.md](./admin/bottle-orders.md) | `/admin/bottle-orders/*` |
| admin | [admin/membership.md](./admin/membership.md) | `/admin/membership/*` |
| admin | [admin/orders.md](./admin/orders.md) | `/admin/orders` |
| admin | [admin/misc.md](./admin/misc.md) | `/admin/blacklist`, `/admin/youtube`, `/admin/shipping-policy`, `/admin/manual-purchases/import` |
| main | [main/auth.md](./main/auth.md) | `/sign-in`, `/sign-up`, `/find-password`, `/nice/callback` |
| main | [main/archive.md](./main/archive.md) | `/archive`, `/archive/[bottleId]`, `@modal/(.)archive/[bottleId]` |
| main | [main/reservation.md](./main/reservation.md) | `/reservation`, `/reservation/[noticeId]` |
| main | [main/orders.md](./main/orders.md) | `/orders/guest`, `/orders/payment/success`, `/orders/payment/fail` |
| main | [main/board.md](./main/board.md) | `/board/community/*`, `/board/news/*` |
| main | [main/general-items.md](./main/general-items.md) | `/(main)/general-items/*` 사용자 화면 |
| main | [main/home.md](./main/home.md) | `/`, `/about`, `/brand`, `/terms` 사용자 진입 화면 |
| main | [main/my-page.md](./main/my-page.md) | `/my-page/*` 사용자 마이페이지 (주문/멤버십/사업자등록/문의) |
| business | [business/index.md](./business/index.md) | `/business/*` 사업자 화면 |
| business | [business/pickup-reservations.md](./business/pickup-reservations.md) | `/business/pickup-reservations/*` 사업자 픽업 예약 관리 |

## 작성 원칙

### 서술 대상
- **뷰**: 무엇이 보이는가 (테이블/폼/배지/버튼)
- **기능**: 무엇이 동작하는가 (액션, 필터, 검색)
- **흐름**: 상태 전이, 페이지 이동, 리다이렉트
- **도메인**: 연관 개녀 (재고, 커뮤니티 역할, 사업장)
- **공용 컴포넌트**: 여러 페이지에 쓰이는 UI는 공용 마킹 + 동작 방식 (`router.back()` vs `push()`, URL 기반 여부 등)
- **특수 동작**: 풀스캔, 강제 리다이렉트, 비활성화 조건 등 예외적 로직

### 서술 금지
- 컴포넌트명, 파일 라인번호, 타입 시그니처 (graphify/codegraph 영역)
- 자명한 CRUD 설명 ("목록을 보여준다", "생성 폼이다") — 특수 라우트만 목적 명시

### 테이블 표현
실제 md 테이블 포맷 사용. 헤더 + 1~2열 예시로 가시성 확보. 열 순서가 중요한 경우(방금 변경 등) 순서 명시.

### 공용 컴포넌트 표현
테이블로 정리: 컴포넌트 | 역할 | 동작 방식. 동작은 `router.back()`/`push()`/context/URL 동기화 등 명시.

## 갱신

- 코드 변경 완료 시 Stop hook이 관련 문서를 자동 갱신 + `graphify update .` 동기화
- 스크립트: `.claude/scripts/refresh-page-docs.sh`
- 비활성화: `.claude/scripts/.skip-page-docs` 파일 생성

## 템플릿

새 페이지 문서 작성 시 `admin/reservations.md`를 참조.
