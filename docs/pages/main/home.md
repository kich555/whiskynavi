# 메인 화면 — `/`, `/about`, `/brand`, `/terms`

`(main)` 라우트 그룹의 사용자 진입 화면군. 위스키내비 브랜드 소개, 브랜드 라인업 탐색, 서비스 이용약관을 제공하며 모든 페이지는 공용 Header/Footer 레이아웃을 공유한다. 상품 탐색/주문/예약 등 핵심 기능 화면(`/archive`, `/general-items`, `/reservation`)은 별도 문서에서 다룬다.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/` | 홈 — 배너·신규 입고·퀵네비·유튜브 | ★ 이 화면군 진입점 |
| `/about` | 회사 소개 — 스토리텔링 스크롤 페이지 | 클라이언트 인터랙션 중심 |
| `/brand` | 브랜드 라인업 — 4개 브랜드 섹션 | RSC + 스크롤 context |
| `/terms` | 이용약관 — 정적 약관 | SEO 메타데이터 |

## 공용 컴포넌트 (`(main)/_components/layout/`)

이 화면군 전반(정확히는 `(main)` 그룹 전체)에 걸쳐 쓰이는 레이아웃. 동작 방식 명시.

| 컴포넌트 | 역할 | 동작 |
|---|---|---|
| Header | 상단 고정 헤더(로고, 네비게이션, 인증 영역) | `fixed` 위치. 스크롤 시 배경 투명→반투명 전환(`useScrolled` hook, scrollY > 0). **admin 경로에서는 렌더 안 함**(`pathname.startsWith("/admin")` 체크) |
| Footer | 하단 푸터(회사 정보, 링크) | 정적 링크 모음. `/about`, `/brand`, `/archive`, `/general-items`, `/reservation`, `/terms`로 이동 |
| DesktopNavMenu | 데스크톱 네비게이션 (`lg:flex`) | `Link` 기반 `router.push`. 활성 경로는 `pathname.startsWith(href)`로 판별해 하이라이트. **세션 있을 때만 "예약하기" 노출** |
| MobileNavMenu | 모바일 햄버거 메뉴 (`lg:hidden`) | `overlay.open`으로 Sheet(우측 슬라이드). 메뉴 항목 클릭 시 `close()`로 시트 닫음. 활성 경로 하이라이트 동일 |
| DesktopAuthArea | 데스크톱 인증 영역 | 미로그인: "비회원 주문조회"(`/orders/guest`) + "로그인"(`/sign-in`) 링크. 로그인 중: 스켈레톤. 로그인됨: 유저명+아바타 버튼 → `overlay.open`으로 유저메뉴 드롭다운 |
| UserMenuDropdown | 유저메뉴 드롭다운 (데스크톱) | "마이페이지", "1:1 문의" 항상. **관리자 역할(`ROLE_ADMIN`)일 때만 "관리자 페이지"(`/admin`)**. **비즈니스 역할(`ROLE_BUSINESS`)일 때만 "비즈니스 관리"(`/business`)**. 로그아웃 → `signOut({ callbackUrl: "/" })` (홈으로 이동) |
| MobileAuthSection | 모바일 인증 영역 (시트 내) | 데스크톱과 동일한 분기 로직. 관리자/비즈니스 메뉴 조건부 노출, 로그아웃 동일 |
| Hero | 페이지 상단 히어로 배너 | `/brand`에서 사용. 거대 배경 텍스트 + 그리드 라인 + 글로잉 도트 정적 장식. 데이터 없음 |

**네비게이션 링크 구성** (Header `constants.ts`):

| 링크 | 경로 | 노출 조건 |
|---|---|---|
| 회사소개 | `/about` | 항상 |
| 브랜드 | `/brand` | 항상 |
| 아카이브 | `/archive` | 항상 |
| 일반상품 | `/general-items` | 항상 |
| 공지사항 | `/board/news` | 항상 |
| 커뮤니티 | `/board/community` | 항상 |
| 예약하기 | `/reservation` | **로그인 세션 있을 때만** |

## 페이지별 맥락

### / — 홈 ★

사용자 첫 진입점. RSC에서 3개 데이터를 `Promise.all`로 병렬 페칭 — 배너(최대 10개), 신규 입고 병(최신 8개, `bottledDate,desc` 정렬), 유튜브 임베드 URL. **각 페칭은 `.catch()`로 빈 데이터 폴백** — 백엔드 장애 시에도 페이지는 렌더링됨.

**섹션 구성** (상단부터):

1. **배너 섹션** — 풀스크린 히어로. 5초 간격 자동 슬라이드 전환. 우측 세형 인디케이터(dot)로 수동 이동 가능. 배너에 `link`가 있으면 "자세히 보기" 버튼이 해당 URL로 이동(`<a href>`, 외부 링크 가능), 없으면 비활성 스타일. 배너 0개면 "배너가 준비 중입니다" 플레이스홀더. **`title`이 없는 배너는 필터링으로 제거** — 빈 타이틀 배너는 미표시.

2. **신규 입고 (NEW ARRIVALS)** — 병 카드 2열(모바일)/4열(데스크톱) 그리드. 각 카드는 이미지 클릭 시 `ImageLightbox`(확대 모달), 텍스트 영역 클릭 시 `/archive/[bottleId]`로 이동. "전체 제품 보기" 버튼 → `/archive`.

3. **퀵네비게이션 카드** — 4개 정사각 카드. 동작이 카드마다 다름:

| 카드 | 동작 |
|---|---|
| OUR BRANDS | `Link` → `/brand` |
| ARCHIVE | `Link` → `/archive` |
| RESERVATION | **준비중 모달** (`overlay.open` + Dialog). `/reservation`로 이동 안 함 |
| COMMUNITY | **준비중 모달**. 커뮤니티 대신 단톡방 안내 메시지 |

4. **유튜브 섹션** — 유튜브 임베드 URL이 있을 때만 렌더. iframe 재생기 + "더 많은 영상 보러가기" 외부 링크(`@WhiskyNavi` 채널, `target="_blank"`). URL 없으면 섹션 자체 미표시.

### /about — 회사 소개

브랜드 스토리텔링 페이지. **모바일/데스크톱 컴포넌트를 동시 렌더**하고 `lg:hidden`/`hidden lg:block`으로 디바이스별 분기 — 동일 내용이지만 레이아웃/타이포그래피가 다름. 클라이언트 컴포넌트(스크롤 인터랙션 필요).

**섹션 구성**:

1. **풀스크린 히어로** — WHISKYNAVI 로고 + "대한민국 최초의 독립 병입 브랜드" 스테이트먼트. 그라데이션 배경 + SVG 곡선/별 장식. Framer Motion 진입 애니메이션. 하단 스크롤 인디케이터.

2. **가로 스크롤 — 3원칙** — `400vh` 높이의 스티키 컨테이너. 세로 스크롤 진행도를 계산해 3개 슬라이드(DISCOVER / TASTE / NAVIGATE)를 가로 전환. 각 슬라이드마다 다른 배경 이미지(바rel/글래스/나침반)와 방향성(좌/우/중앙 정렬). 하단 진행 인디케이터 3개.

3. **WHAT WE DO** — 4개 사업 영역. **데스크톱**: 4열 가로 배치, 호버 시 해당 영역 확장(`hover:flex-2`) + 배경 이미지/설명 페이드인. **모바일**: 세로 스택, 항상 설명 노출.

| 영역 | 내용 |
|---|---|
| SPIRIT SOURCING | 원액 선별·소싱, 캐스크 매칭 |
| CASK CURATION | 최적 캐스크 엄선, 숙성 관리, 병입 시점 탐색 |
| IMPORT | 해외 브랜드 공식 수입·유통, 독점 파트너십 |
| OEM | 맞춤형 위스키 제조(블렌딩~라벨 디자인) |

**특수 동작**: 스크롤 이벤트 리스너로 `getBoundingClientRect()` 계산 — 스티키 섹션이 뷰포트에 고정되어 있는 동안 스크롤 진행률(0~1)을 3등분해 `currentSlide` 갱신. 언마운트 시 리스너 정리.

### /brand — 브랜드 라인업

RSC. Hero 배너("BRANDS" 거대 배경 텍스트) + 4개 브랜드 섹션. 4개 브랜드는 정적 상수(`NAVI`, `TAILS`, `TRAIL_AND_TAIL`, `TOGETHER_IN_SPIRIT`). 각 브랜드별로 병 6개를 `Promise.all`로 병렬 페칭, 실패 시 빈 배열 폴백.

**브랜드 라인업**:

| 브랜드 | ID | 성격 |
|---|---|---|
| 위스키내비 | `위스키내비` | 대표 브랜드, 가장 세분화된 라인업 |
| 더 위스키테일즈 | `위스키테일즈` | 서브컬처 라벨, 스토리/테마 중심 |
| 트레일앤테일 | `트레일&테일` | 취향의 흔적과 이야기를 담은 한정 보틀 |
| 투게더 인 스피릿 | `투게더인스피릿` | 사회적 가치 기부 캠페인 한정 보틀 |

**섹션 구성**:
- 상단 **BrandNavigation** — 4개 브랜드 아이콘 그리드(데스크톱 1x4, 모바일 2x2). 클릭 시 해당 브랜드 섹션으로 스무스 스크롤 이동(`scrollIntoView({ behavior: "smooth" })`). **context 기반** — `BrandScrollProvider`가 각 섹션의 ref를 등록(`registerRef`), 네비게이션은 `scrollTo(id)`로 호출. URL 변경 없음(앵커 이동 아님).
- 각 브랜드 섹션 — 배경 이미지 + 타이틀 + 철학 설명 + 제품 캐러셀(병 있을 때만) + "더 많은 제품 보러가기" 버튼.
- **"더 많은 제품 보러가기"** → `/archive?brand={brand.id}`. 아카이브 페이지로 이동하며 해당 브랜드 필터 적용.
- **제품 캐러셀** — 3D 캐러셀(`Carousel3D`). 병 카드가 3D 원근감으로 배치, 중심 카드 하이라이트.

### /terms — 이용약관

정적 약관 페이지. RSC. `TERMS_SECTIONS` 상수(15개 조항)를 맵핑해 렌더링. SEO 메타데이터(`title: "이용약관"`, `description`) 포함.

**구성**:
- 헤더 — "Terms of Service" 라벨, "이용약관" 타이틀, 설명, 시행일
- 본문 — 15개 조항(제1조 목적 ~ 제15조 분쟁 해결). 각 조항은 타이틀 + 단락 배열. `divide-y`로 조항 간 구분선.
- 부칙 — 시행일 재명시
- 연락처 박스 — 회사명, 대표, 전화, 이메일

**주요 조항 주제**: 서비스 정의, 약관 변경 공지 기준(7일/30일), 주문 계약 성립 조건, 판매 정책(배송/수령 방식), 결제, 배송(최대 6주), 청약철회/교환/반품(7일 이내, 예외 사유), 환불(3영업일), 지식재산권, 책임 제한, 관할.

**특수**: 약관 텍스트는 `TERMS_TEXT` 상수로도 직렬화 가능 — 약관 전문을 단일 문자열로 제공(약관 동의 UI 등에서 활용).

## 데이터 흐름 (개요)

- `/`, `/brand`는 RSC — 백엔드 API 직접 페칭(배너, 병). `/about`, `/terms`는 데이터 페칭 없음(정적 콘텐츠).
- 홈/브랜드 모두 `Promise.all` 병렬 페칭 + 개별 `.catch()` 폴백 — 부분 장애 시에도 페이지 렌더링 유지.
- 인증 상태는 Header/Footer에서 `next-auth` `useSession()`으로 클라이언트 사이드 확인. 역할(`ROLE_ADMIN`, `ROLE_BUSINESS`) 기반 메뉴 분기.
- `/about`의 가로 스크롤 인터랙션은 클라이언트 사이드 스크롤 리스너 — SSR 시 첫 슬라이드(DISCOVER)만 표시.

## 외부 의존

- **인증**: NextAuth(`useSession`) — 헤더 인증 영역, 역할 기반 메뉴
- **API**: 원격 백엔드 `api.whiskynavi.com` — 배너, 병 목록, KV 스토어(유튜브 URL)
- **유튜브**: 임베드 URL을 KV 스토어에서 조회 — 관리자가 URL 갱신하면 홈에 반영
- **오버레이**: `overlay-kit` — 퀵네비 준비중 모달, 모바일 메뉴 시트, 유저메뉴 드롭다운

## 참고

- 코드 구조 탐색: `graphify query "main home about brand terms"`
- 네비게이션 링크 정의: `src/app/(main)/_components/layout/Header/constants.ts`
- 약관 본문: `src/lib/terms.ts`
- 브랜드 정의: `src/app/(main)/brand/_constants/index.ts`
