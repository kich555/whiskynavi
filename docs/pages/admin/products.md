# 관리자 보틀 관리 — `/admin/products/*`

위스키 병(보틀) 마스터 데이터를 관리자가 관리. 병 등록/수정/삭제, 브랜드·증류소 필터, 라벨 이미지 업로드, 상세 정보 조회.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/admin/products` | 보틀 목록 | 브랜드·증류소 필터, 검색 |
| `/admin/products/new` | 보틀 신규 등록 폼 | 라벨 이미지 필수 |
| `/admin/products/[productId]` | 보틀 상세 | ★ 이 화면군 핵심 |
| `/admin/products/[productId]/edit` | 보틀 수정 폼 | 존재하지 않는 ID면 `notFound()` |

## 공용 컴포넌트 (admin/_components/)

이 화면군 전반에 쓰이는 공용 UI. 동작 방식 명시.

| 컴포넌트 | 역할 | 동작 |
|---|---|---|
| `AdminHeader` | 상단 헤더(타이틀, 사이드바 토글, 검색) | 사이드바 토글은 context. 검색은 `router.push(현재경로?q=...)` — 페이지 1로 리셋 |
| `Pagination` | URL 기반 페이지네이션 | `router.push(basePath?page=&limit=&...)`. 북마크/공유 가능 |
| `FilterHeader` | 테이블 헤더 내 필터 드롭다운 | `useTableFilter` 기반, URL searchParams 동기화 |

**"목록으로 돌아가기" 버튼 패턴**: 상세·폼 페이지 상단. `router.back()` 사용 — 브라우저 히스토리 기반이라 직접 진입 시엔 이전 페이지가 없을 수 있음. 안전한 이동 필요 시 `router.push('/admin/products')`로 대체 고려. 수정 폼은 "제품 상세로 돌아가기"로 문구가 다름 — `router.back()` 동일.

## 페이지별 맥락

### /admin/products — 보틀 목록

**보틀 테이블** (행 클릭 = `router.push('/admin/products/[id]')`):

| ID | 제품명 | 브랜드 | 증류소 | 시리즈 | 캐스크타입 | 도수 | 용량 | 관리 |
|----|--------|--------|--------|--------|------------|------|------|------|
| 42 | 글렌피딕 18 | 글렌피딕 | 글렌피딕 | 쉐리 오크 | 쉐리 | 40% | 700ml | [상세] |
| 37 | 맥콜 12 | 맥콜 | 맥콜 | 더블캐스크 | 버본 | 40% | 700ml | [상세] |

- **행 액션**: 상세만 제공 (행 전체 클릭 + "상세" 버튼 동일 경로)
- **상단 액션**: "보틀 등록" 버튼 → `router.push('/admin/products/new')`
- **검색**: 헤더 검색창 → `q` 파라미터, 페이지 1로 리셋
- **필터**: 브랜드·증류소 드롭다운 (`FilterHeader`) — URL 기반, 새로고침 유지. 전체 옵션 + API 파라미터 값 목록
- **페이지네이션**: 기본 20건/페이지, `limit` 파라미터로 조절 가능

### /admin/products/new — 보틀 신규 등록

표준 생성 폼. 제품명·브랜드·시리즈·회사·증류소·몰트타입·도수·용량 필수. 라벨 이미지 업로드 **필수** (최대 5MB). 제출 성공 시 `revalidatePath` 후 목록으로 리다이렉트.

**특수 동작**:
- **라벨 이미지**: 생성 시 반드시 업로드. S3(BOTTLE purpose) 업로드 후 key 획득, 병 생성 API에 key 전달
- **추가 이미지**: 최대 9장, 중복 불가. 썸네일로 표시
- **설명(rich text)**: 리치텍스트 에디터. 내용 있으면 sanitize 후 저장, 빈 HTML은 `undefined`로 정규화
- **추가 정보(extraInfos)**: 키-값 쌍 동적 추가. JSON으로 직렬화하여 전송
- **파라미터 자동완성**: 브랜드·증류소·회사 등은 API에서 제공하는 선택지를 콤보박스로 제시하되, 관리자 직접 입력도 허용
- **이미지 업로드 중 제출 방지**: 설명 내 이미지 업로드 진행 시 저장 버튼 비활성화

### /admin/products/[productId] — 보틀 상세 ★

병 1건의 전체 마스터 정보를 읽기 전용으로 표시.

**상단 액션바**:
- "보틀 목록으로 돌아가기" → `router.back()` ⚠️ 공용 패턴
- 편집 → `router.push('/admin/products/[id]/edit')`
- 삭제 → `overlay.open()`으로 삭제 확인 모달 표시

**삭제 모달** (`ProductDeleteModal`):
- 확인 버튼 → `deleteBottleAction` Server Action. 성공 시 `router.push('/admin/products')` (목록으로)
- 실패 시 토스트 에러 메시지. `isPending` 중 버튼 비활성화

**상세 화면 구성** (3단 분할):
1. **왼쪽 — 모든 필드** (설명 제외): 제품명, 브랜드, 시리즈, 회사, 증류소, 몰트타입, 캐스크타입, 캐스크번호, 도수, 용량, 증류/병입 날짜, 재고수량, 공급가, 소비자가, 추가 정보
2. **중간 — 설명**: 리치텍스트 렌더링. 내용 없으면 "설명이 없습니다."
3. **오른쪽 — 이미지 갤러리**: 라벨 이미지 + 추가 이미지. 썸네일 클릭 시 메인 이미지 전환. 이미지 없으면 기본 이미지(`/default-bottle-v2.png`)

**존재하지 않는 ID**: API 호출 실패 시 `notFound()` — 404 페이지.

### /admin/products/[productId]/edit — 보틀 수정

표준 수정 폼. 생성 폼과 동일한 필드 구성에 기존 값을 기본값으로 채움.

**생성과의 차이**:
- **라벨 이미지 선택적**: 새 파일 업로드 시에만 교체. 미선택 시 기존 이미지 유지
- **"제품 상세로 돌아가기"** 버튼 (`router.back()`) — "목록으로"가 아님
- **취소 버튼**: `router.push('/admin/products/[id]')` — 상세로 이동
- 제출 성공 시 `revalidatePath` 후 **상세로 리다이렉트** (`/admin/products/[id]`, 목록이 아님)

**존재하지 않는 ID**: API 호출 실패 시 `notFound()` — 생성 폼과 달리 상세 페이지에서 존재 여부가 이미 검증되므로 비정상 경로.

## 데이터 흐름 (개요)

- 모든 페이지 RSC. `getAuthToken()` + `withToken()` 인증.
- 목록은 `Promise.all`로 보틀 목록 + 파라미터값(브랜드/증류소 선택지) 병렬 페칭.
- 상세/수정은 단건 페칭. 수정 폼은 상세 + 파라미터값 병렬 페칭.
- 변경 액션(생성/수정/삭제)은 Server Action → Orval API.
- 생성/수정 성공 시 `revalidatePath("/admin/products")`로 목록 캐시 무효화 후 리다이렉트.
- 필터/페이지네이션은 URL searchParams 기반 — 북마크/공유 가능.

## 상태 전이 / 예외 로직

- **생성 → 목록**: `redirect("/admin/products")` (Server Action 내 RSC 리다이렉트)
- **수정 → 상세**: `redirect("/admin/products/[id]")` (목록이 아님)
- **삭제 → 목록**: 클라이언트 `router.push("/admin/products")` (Server Action은 결과만 반환, 리다이렉트 않음)
- **존재하지 않는 ID**: 상세·수정 모두 `notFound()`
- **이미지 업로드 실패**: 폼 제출 중단, 에러 메시지 표시. 라벨 이미지 업로드 실패 시 생성 불가
- **이미지 업로드 중 제출 차단**: 설명 내 리치텍스트 이미지 업로드 진행 시 저장 버튼 비활성화 (`isDescriptionUploading`)
- **입력값 검증**: Zod 스키마로 백엔드 @maxLength 제약을 한국어 레이블과 함께 선검증. 필수 필드 누락 시 첫 번째 에러만 표시
- **토큰 부재**: 모든 액션에서 인증 토큰 없으면 즉시 실패 반환

## 외부 의존

- **인증**: NextAuth (admin 접근 제한)
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트)
- **이미지 저장소**: S3 (BOTTLE purpose 엔드포인트) + CloudFront CDN
- **리치텍스트**: 설명 필드 에디터/렌더러, 내부 이미지 업로드 포함

## 참고

- 코드 구조 탐색: `graphify query "admin products"` / `codegraph_explore "admin/products"`
- 공용 컴포넌트: `docs/pages/admin/reservations.md`의 공용 컴포넌트 섹션 참조 (AdminHeader, Pagination, FilterHeader 동작 방식 동일)
