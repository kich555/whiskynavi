# 관리자 배너 관리 — `/admin/banners/*`

메인 화면 상단 노출 배너를 관리자가 관리. 배너 등록/수정/삭제, 게시/게시중단 토글, 노출 순서 조정. 테이블이 아닌 카드 그리드 기반 UI로, 순서 변경이 인라인 액션으로 통합된 것이 특징.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/admin/banners` | 배너 카드 그리드 목록 | 순서 변경·게시 토글·제거 인라인 |
| `/admin/banners/new` | 배너 신규 등록 폼 | 배경 이미지 필수 |
| `/admin/banners/[bannerId]` | 배너 상세 + 미리보기 | |
| `/admin/banners/[bannerId]/edit` | 배너 수정 폼 | |

## 공용 컴포넌트 (admin/_components/)

이 화면군 전반에 쓰이는 공용 UI. 동작 방식 명시.

| 컴포넌트 | 역할 | 동작 |
|---|---|---|
| `AdminHeader` | 상단 헤더(타이틀, 사이드바 토글) | 사이드바 토글은 context. 검색 비활성화(`showSearch=false`) — 배너는 검색 미지원 |
| `Pagination` | URL 기반 페이지네이션 | `router.push(basePath?page=&limit=&...)`. 북마크/공유 가능 |

**"목록으로 돌아가기" 버튼 패턴**: 상세·생성·편집 페이지 상단. `router.back()` 사용 — 브라우저 히스토리 기반이라 직접 진입 시엔 이전 페이지가 없을 수 있음. 편집 페이지의 "취소" 버튼은 `router.push('/admin/banners/[id]')`로 명시적 이동.

## 페이지별 맥락

### /admin/banners — 배너 카드 그리드 목록 ★ 이 화면군 핵심

테이블이 아닌 **반응형 카드 그리드**(1열 모바일 / 2열 태블릿 / 3열 데스크톱). 각 카드에 인라인 액션이 통합되어 있어 목록에서 직접 조작.

**카드 구성**:

| 배경 이미지 | 제목 · 게시 상태 배지 | 설명(1줄) | ID · 순서 · 링크 | [위로][아래로][게시/중단][제거] [상세] |
|---|---|---|---|---|
| (이미지 썸네일) | 스프링 세일 · 게시중 | 시즌 한정판 위스키... | ID: 5 · 순서: 0 · /spring | [위로][아래로][게시중단][제거] [상세] |
| (이미지 썸네일) | 겨울 이벤트 · 게시중단 | 12월 한정 배너 | ID: 3 · 순서: 1 | [위로][아래로][게시][제거] [상세] |

- **정렬**: `sortOrder` 오름차순, 동일하면 `id` 오름차순 — 클라이언트 단 정렬(서버 정렬 아님)
- **순서 변경**(위로/아래로): 인접 배너와 `sortOrder` 교환. `updateBannerOrdersAction` Server Action 호출 → 성공 시 `router.refresh()`. 첫 행의 "위로"/마지막 행의 "아래로" 비활성화. 액션 진행 중(`isPending`) 모든 인라인 버튼 비활성화
- **게시 토글**: 현재 게시 상태에 따라 게시/게시중단 액션 호출. `publishBannerAction` / `unpublishBannerAction` — `revalidatePath`로 목록+상세 갱신
- **제거**: `window.confirm` 확인 후 `deleteBannerAction` 호출. 별도 비활성화 조건 없음 — 게시중 배너도 즉시 제거 가능
- **상단 액션**: "배너 등록" 버튼 → `router.push('/admin/banners/new')`
- **검색 미지원**: 헤더 검색창 숨김. 페이지네이션만 URL 동기화(`page`, `limit`, 기본 12건/페이지)

### /admin/banners/new — 배너 신규 등록

생성 폼. 제목(필수)·설명(선택)·링크(선택)·배경 이미지(**필수**) 입력.

- **배경 이미지 필수**: 파일 미선택 시 에러. 최대 5MB
- **파일명 정규화**: 업로드 시 `banner_{timestamp}.{ext}`로 파일명 단축 — DB 컬럼 길이 초과 방지
- **이미지 업로드 UX**: 드래그앤드롭 + 클릭 선택. 미리보기 + 호버 시 변경/제거 오버레이. 클라이언트 단 크기 검증 후 폼 제출 시 서버 단 재검증
- **제출 성공**: `redirect('/admin/banners')` — 목록으로 이동
- **"배너 목록으로 돌아가기"**: `router.back()`

### /admin/banners/[bannerId] — 배너 상세 + 미리보기

배너 1건의 메타데이터와 실제 노출 형태 미리보기를 한 화면에서 확인.

**상단 액션바**:
- "배너 목록으로 돌아가기" → `router.back()` ⚠️ 공용 패턴
- 편집 → `router.push('/admin/banners/[id]/edit')`

**섹션 구성**:
1. **미리보기** — 배경 이미지 위에 제목·설명 오버레이된 실제 배너 렌더링. 어두운 배경 + 흰색 텍스트로 노출 형태 시뮬레이션
2. **배너 정보** — ID, 제목, 게시 상태, 노출 순서, 설명, 링크(외부 링크 `target="_blank"`)

**데이터 페칭**: RSC에서 `getApiAdminBannersId` 호출. 실패 시 `notFound()` — 404 페이지.

### /admin/banners/[bannerId]/edit — 배너 수정

수정 폼. 제목·설명·링크·배경 이미지 입력. 신규 등록과 달리 **배경 이미지가 선택**이며, 이미지 미변경 시 기존 이미지 유지.

- **데이터 페칭**: RSC에서 기존 배너 데이터 조회. 실패 시 `notFound()`
- **폼 초기값**: 기존 배너 데이터로 `defaultValue` 설정. 배경 이미지 미리보기는 기존 URL
- **이미지 교체**: 새 파일 선택 시에만 전송. 미선택 시 `undefined` — 서버에서 기존 유지
- **제출 성공**: `redirect('/admin/banners/[id]')` — 상세로 이동 (목록이 아님)
- **"배너 상세로 돌아가기"**: `router.back()`
- **취소 버튼**: `router.push('/admin/banners/[id]')` — 명시적 이동 (히스토리 의존 X)
- **별도 강제 리다이렉트 없음** — 게시 상태와 무관하게 항상 편집 가능

## 도메인 개념

- **게시 상태(published)**: `true`(게시중) / `false`(게시중단). 게시중 배너만 사용자 화면 노출. 관리자는 언제든 토글 가능
- **노출 순서(sortOrder)**: 배너 표시 순서. 목록에서 위로/아래로 버튼으로 인접 배너와 교환. `sortOrder` 동일 시 `id`로 tie-break
- **배경 이미지(backgroundImg)**: 배너 전체를 채우는 메인 이미지. 신규 생성 시 필수, 수정 시 선택
- **링크(link)**: 배너 클릭 시 이동할 외부 URL. 선택 항목

## 상태 전이

배너는 명시적 상태 머신이 단순함:

```
게시중단 ↔ 게시중 (publishBannerAction / unpublishBannerAction)
존재 → 제거 (deleteBannerAction — 언제든 가능, 게시중이어도 제거 가능)
```

순서 변경은 상태 전이가 아닌 정렬값 교환 — 항상 2건씩 쌍으로 `sortOrder` 교환.

## 데이터 흐름 (개요)

- 모든 페이지 RSC. `getAuthToken()` + `withToken()` 인증.
- 목록은 서버에서 페이지 단위 페칭, 클라이언트에서 `sortOrder` 재정렬.
- 상세/편집은 `getApiAdminBannersId` 단건 페칭. 실패 시 `notFound()`.
- 변경 액션(생성/수정/게시/게시중단/제거/순서변경)은 Server Action → Orval API.
- 생성/수정 성공 시 `redirect()` — RSC 단에서 강제 이동.
- 게시/게시중단/제거/순서변경 성공 시 `revalidatePath`로 캐시 갱신 + `router.refresh()`.
- 토큰 리프레시/에러 핸들링은 mutator가 일괄 처리.
- 페이지네이션은 URL searchParams 기반 — 북마크/공유 가능. 검색 미지원.

## 외부 의존

- **인증**: NextAuth (admin 접근 제한)
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트)
- **이미지 업로드**: 배경 이미지 파일 직접 전송 — 서버 저장, 최대 5MB

## 참고

- 코드 구조 탐색: `graphify query "admin banners"` / `codegraph_explore "admin/banners"`
