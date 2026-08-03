# 관리자 잡동사니 라우트 — `/admin/blacklist`, `/admin/youtube`, `/admin/shipping-policy`, `/admin/manual-purchases/import`

단일 목적 설정·운영 페이지들. 각 라우트가 서로 다른 도메인(회원 제재, 홍보 영상, 배송비 정책, 구매내역 대량 등록)을 담당하지만 공통 관리 레이아웃과 공용 컴포넌트를 공유. 대시보드 홈(`/admin`)과 인증 가드/에러 바운더리는 [admin/_index.md](./_index.md) 참고.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/admin/blacklist` | 제재 회원 목록 + 등록/수정/해제 | 클라이언트 사이드 필터·페이지네이션 |
| `/admin/youtube` | YouTube embed URL 관리 | 단일 값 편집 폼 |
| `/admin/shipping-policy` | 배송비 정책 편집 | 단일 레코드 설정 폼 |
| `/admin/manual-purchases/import` | 수동 구매내역 Excel 대량 등록 ★ | 특수 — 별도 설명 |

## 공용 컴포넌트 (admin/_components/)

| 컴포넌트 | 역할 | 동작 |
|---|---|---|
| `AdminHeader` | 상단 헤더(타이틀, 사이드바 토글, 검색) | 사이드바 토글은 context. 검색은 `router.push(현재경로?q=...)` — 페이지 1로 리셋. 검색 불필요 라우트는 `showSearch={false}` |
| `Pagination` | URL 기반 페이지네이션 | `router.push(basePath?page=&limit=&...)`. 북마크/공유 가능. blacklist에서만 사용 |
| `useSidebar` | 사이드바 토글 context | 모든 페이지가 `toggle`을 `AdminHeader`에 전달 |

**"목록으로 돌아가기" 버튼**: 이 화면군에는 목록/상세 분리가 없어 사용 안 함. 모든 변경 후 `router.refresh()` 또는 Server Action의 `revalidatePath`로 현재 페이지 갱신.

## 페이지별 맥락

### /admin/blacklist — 제재 회원 관리

블랙리스트(제재 중인 회원) 목록과 제재 등록/수정/해제. 회원 관리의 하위 기능이지만 독립 라우트.

**블랙리스트 테이블**:

| ID | 이름 | 이메일 | 사유 | 제재 시작일 | 제재 종료일 | 관리 |
|----|------|--------|------|------------|------------|------|
| 42 | 홍길동 | hong@example.com | 부정거래 | 2026.07.01 | 영구 | [수정][해제] |
| 38 | 김사장 | kim@biz.com | 악성 리뷰 | 2026.06.15 | 2026.09.15 | [수정][해제] |

- **영구 제재 표시**: 종료일이 3000년 이상이면 "영구" 배지(destructive). 사유는 tooltip으로 전체 표시
- **상단 액션**: "블랙리스트 추가" 버튼(destructive) → 사용자 ID + 사유 + 기간 입력 모달
- **건별 액션**: 수정(사유/기간 변경), 해제(제재 취소)
- **검색**: 헤더 검색창 → 이름·이메일·사유 대상 클라이언트 사이드 필터. `router.push(현재경로?q=...)`로 URL 동기화, 페이지 1 리셋

**특수 동작 — 클라이언트 사이드 페이지네이션**:
백엔드에서 `isBanned: true`로 전체 제재 회원을 1페이지에 가져오지 않고, RSC가 페이지별 페칭 후 클라이언트가 추가로 `q` 검색어로 로컬 필터링. 즉 검색은 서버를 거치지 않고 받아온 페이지 데이터 내에서만 동작. `Pagination`은 필터링된 결과 기준.

**제재 해제 로직**: 종료일을 과거(2000-01-01)로 설정해 사실상 해제. 삭제가 아닌 상태 전이.

**상태 전이**:
`정상 → 제재중 (banUserAction)` / `제재중 → 정상 (cancelUserBanAction — 종료일 과거로)`

모든 변경 성공 시 `revalidatePath('/admin/blacklist')` + `router.refresh()`. 페이지 이동 없음.

### /admin/youtube — YouTube 홍보 영상 관리

메인 화면에 임베드할 YouTube 영상 URL 한 개를 관리. KV 스토어 기반 단일 값.

**폼 구성**:
- URL 입력창 — watch, embed, youtu.be, shorts 형식 모두 지원
- 실시간 미리보기 — 입력값을 embed URL로 변환해 iframe 렌더링
- "변경" 버튼 — 미리보기 가능한 유효 URL일 때만 활성화

**특수 동작 — 404 허용**:
RSC가 KV 스토어에서 값을 가져올 때 키가 없으면(최초 설정 전) 404를 정상 상태로 취급. 빈 문자열로 렌더링. 다른 에러는 상위로 throw.

**성공 피드백**: 제출 성공 시 "변경되었습니다." 메시지 3초간 표시 후 자동 숨김. 페이지 이동 없음.

**URL 변환**: 입력된 다양한 YouTube URL 형식에서 video ID 추출 → `https://www.youtube.com/embed/{id}`로 정규화. 변환 실패 시 미리보기 영역에 경고 표시.

### /admin/shipping-policy — 배송비 정책

일반상품 배송 주문에 적용되는 배송비 정책 단일 레코드 편집.

**폼 필드**:
- **정책 사용 여부** — 토글 스위치(enabled). OFF면 배송비 정책 미적용
- **기본 배송비** — 숫자 입력(원)
- **무료배송 기준 금액** — 숫자 입력(원). 주문 합계가 이 이상이면 무료배송

저장 성공 시 "배송비 정책이 저장되었습니다." 메시지 표시. 페이지 이동 없음. RSC가 최초 로드 시 현재 정책 값을 가져와 폼 초기값으로 설정.

### /admin/manual-purchases/import — 수동 구매내역 Excel 대량 등록 ★ 특수

Excel 파일로 수동 구매내역(오프라인/기존 주문)을 일괄 등록. 일반 CRUD가 아닌 대량 임포트 워크플로.

**목적**: 개별 주문 등록이 아닌, Excel 템플릿을 통해 여러 사용자×보틀 조합의 구매내역을 한 번에 처리. dry-run 검증 → 실제 등록 2단계 워크플로.

**임포트 모드 3가지**:

| 모드 | 의미 | 템플릿 다운로드 조건 |
|------|------|---------------------|
| 한 사용자 여러 보틀 | 고정 사용자 1명, 보틀을 행별로 | 사용자 선택 필수 |
| 한 보틀 여러 사용자 | 고정 보틀 1개, 사용자를 행별로 | 보틀 선택 필수 |
| 여러 사용자 여러 보틀 | 사용자·보틀 모두 Excel 행별 | 별도 선택 불필요 |

**워크플로**:
1. 모드 선택 → (필요시) 사용자/보틀 선택
2. **템플릿 다운로드** — 선택한 기준에 맞는 Excel 템플릿. 모드에 따라 사용자 또는 보틀 미선택 시 비활성화 + 토스트 경고
3. Excel 작성 후 파일 선택 (`.xlsx`만)
4. **검증(dry-run)** — `dryRun: true`로 백엔드 호출, 실제 저장 없이 유효성만 확인
5. **실제 등록** — `dryRun: false`로 저장 실행

**결과 요약 영역** (업로드 후 표시):

| 행 | 사용자ID | 보틀ID | 주문번호 | 결과 | 메시지 |
|----|---------|--------|---------|------|--------|
| 1 | 42 | 108 | ORD-2026-001 | 성공 | - |
| 2 | 38 | 105 | - | 실패 | 재고 부족 |

- 전체/성공/실패 행 수 요약
- 실패 행 상세 별도 패널(빨간 배경) + 토스트 경고
- 행별 결과 테이블(스크롤 가능)

**참조 테이블 영역** (좌: 사용자, 우: 보틀):
- 각각 독립 검색창 — 사용자는 검색 필드(이름/아이디/이메일/전화번호) 선택 가능
- 검색은 URL searchParams 기반 (`userQ`, `userField`, `bottleQ`) — RSC가 검색어로 백엔드 조회 후 결과 렌더링
- 각 행에 "선택" 버튼(모드에 따라 활성화) + "열기" 링크(`/admin/users/{id}`, `/admin/products/{id}`)
- "전체 보기" 링크 → 각 관리 페이지로 이동

**특수 동작 — 이중 revalidate**:
업로드 성공 시 `/admin/manual-purchases/import`뿐 아니라 `/admin/orders`, `/admin/bottle-orders`도 revalidate. 구매내역 등록이 주문/보틀주문 목록에 영향을 주기 때문.

**비활성화 조건**:
- 템플릿 다운로드: 모드가 "한 사용자"인데 사용자 미선택, 또는 "한 보틀"인데 보틀 미선택
- 검증/실제 등록: 파일 미선택 시 토스트 에러. 진행 중에는 모든 버튼 비활성화

## 데이터 흐름 (개요)

- 모든 페이지 RSC. `getAuthToken()` + `withToken()` 인증.
- youtube는 KV 스토어 API(키-값), shipping-policy는 단일 레코드 API, blacklist는 회원 API의 `isBanned` 필터링.
- import는 사용자·보틀 조회를 `Promise.all` 병렬 페칭. 업로드/템플릿은 Server Action이 백엔드 직접 호출.
- 토큰 리프레시/에러 핸들링은 mutator가 일괄 처리.
- youtube/shipping-policy는 `useActionState` 폼, blacklist는 `useTransition` + overlay-kit 모달, import는 `useTransition` + 직접 액션 호출.

## 외부 의존

- **인증**: NextAuth (admin 접근 제한)
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트)
- **KV 스토어**: youtube embed URL 저장 (백엔드 키-값 API)
- **Excel**: import 템플릿 다운로드(base64) / 업로드(multipart). 브라우저에서 base64 → Blob → 다운로드
- **overlay-kit**: blacklist 등록/수정/해제 모달
- **sonner 토스트**: blacklist/import 피드백

## 참고

- 코드 구조 탐색: `graphify query "admin dashboard blacklist youtube shipping-policy manual-purchases import"`
