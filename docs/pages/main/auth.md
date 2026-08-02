# 사용자 인증 — `/sign-in`, `/sign-up`, `/find-password`, `/nice/callback`

사용자 화면(`(main)` 그룹)의 인증 플로우. 이메일/비밀번호 Credentials 로그인, NICE 본인인증 기반 회원가입, 이메일 인증코드 기반 비밀번호 초기화, 그리고 NICE 인증 팝업이 돌아오는 콜백 라우트로 구성. 소셜 로그인(Google/Kakao/Naver)은 NextAuth 프로바이더로 노출되나 아래 페이지 폼 자체는 Credentials 전용.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/sign-in` | 로그인 폼 | 회원가입 완료 후 `?registered=true` 쿼리로 진입 시 토스트 |
| `/sign-up` | 회원가입 (funnel 2단계) | ★ 본인인증 → 회원정보입력 |
| `/find-password` | 비밀번호 초기화 | 이메일 인증코드 → 임시 비밀번호 발급 |
| `/nice/callback` | NICE 본인인증 콜백 | ⚠️ 특수 — 라우트 그룹 밖 `/app/nice/callback`, 팝업 전용 |

## 공용 컴포넌트 / 공통 동작

이 화면군은 `(main)/_components` 공용 UI를 쓰지 않고 각 라우트 로컬 폼 컴포넌트로 자체 구성. 공통되는 동작 패턴만 정리.

| 요소 | 역할 | 동작 |
|---|---|---|
| 로고 헤더 | sign-in / find-password 상단 로고 | 단순 이미지 — 클릭 불가 |
| 링크 바 | sign-in 하단 "회원가입 \| 비밀번호 초기화" | `<Link>` (prefetch). `href="/sign-up"`, `href="/find-password"` |
| "로그인으로 돌아가기" | find-password 완료 화면 | `<Link href="/sign-in">` (prefetch). `router.back()` 아님 — 완료 후 항상 로그인으로 |
| "로그인 페이지로 이동" | sign-up 중복 계정 감지 시 | `window.location.href = "/sign-in"` — hard navigation. `router.push` 아님 |
| FormMessage | 필드/폼 에러·안내 메시지 | 공용 UI (`@/components/ui/form-message`). variant: error/info/success |

## 페이지별 맥락

### /sign-in — 로그인

RSC 페이지가 `searchParams.registered` 를 읽어 클라이언트 토스트를 조건부 렌더. 폼 자체는 클라이언트 컴포넌트.

**뷰**:
- 로고
- 이메일/비밀번호 입력 (밑줄 스타일, 흰색 텍스트 — 어두운 배경 가정)
- 로그인 버튼
- 하단 링크: 회원가입 / 비밀번호 초기화
- 회원가입 직후 진입 시 성공 토스트 (`?registered=true`)

**흐름**:
- 클라이언트 유효성(빈 값, 이메일 형식) 선검사 → `signIn("credentials", { redirect: false })` (NextAuth)
- 성공(`result.ok`) 시 `router.push("/")` + `router.refresh()` — 홈으로 이동하며 세션 갱신
- 실패(`result.error`) 시 "이메일 또는 비밀번호가 올바르지 않습니다." 인라인 에러
- `registered=true` 쿼리 파라미터: sign-up 성공 Server Action이 `redirect("/sign-in?registered=true")` 로 전달. 페이지 진입 즉시 toast.success("회원가입이 완료되었습니다. 로그인해주세요.") 1회 노출

### /sign-up — 회원가입 ★

funnel 기반 2단계 폼. 본인인증(NICE) 완료 결과를 들고 회원정보 입력 단계로 전환. `useFunnel` 훅이 스택으로 단계 관리 (`history.push` / `history.back`). URL 동기화 안 함 — 새로고침 시 첫 단계(본인인증)로 리셋.

**단계 전이**:
`본인인증 → 회원정보입력` (인증 성공 시 push)
`회원정보입력 → 본인인증` ("다시 인증" 버튼 = `history.back()`)

#### Step 1: 본인인증 (NICE)

**뷰**:
- 안내 문구("회원가입은 본인인증 후 진행됩니다...")
- "본인인증 시작" 버튼
- DEV 환경에서만 "[DEV] 본인인증 건너뛰기" 버튼 노출 (`NODE_ENV === "development"`)
- 중복 계정 감지 시 별도 에러 카드: "이미 가입된 계정입니다. 기존 로그인 방식: {existingAuthType}" + "로그인 페이지로 이동" 버튼

**NICE 인증 흐름** (팝업 + BroadcastChannel 연동):
1. "본인인증 시작" → 백엔드에 세션 생성 요청 (`returnUrl` = `/nice/callback?niceSessionId={UUID}`)
2. 응답의 `authUrl` 을 `window.open` 으로 팝업(430x720). 팝업 차단 시 새 탭(`_blank`) 폴백, 그것도 막히면 에러
3. 팝업에서 NICE 인증 완료 → `/nice/callback` 로 리다이렉트 (아래 별도 설명)
4. 콜백 페이지가 `BroadcastChannel(nice-verification-{sessionId})` 로 메시지 post → 부모 창의 `useNiceVerification` 이 수신
5. 성공 메시지 수신 시 백엔드에 인증 결과 조회(`requestNo` + `webTransactionId`) → 이름/전화번호/생년월일/성별 확보 → `onSuccess(profile)` 콜백 → funnel 다음 단계 push
6. 에러 메시지 수신 시 인라인 에러 표시

**상태/예외**:
- `sessionId` 는 컴포넌트 마운트 시 `crypto.randomUUID()` 로 1회 생성 — 인증 재시도에도 동일 세션 ID 재사용
- `requestNo` 는 세션 생성 응답에서 확보 후 상태 보관 — 콜백 수신 시 없으면 "인증 세션 정보가 없습니다" 에러
- 인증 결과에서 필수 정보(이름/전화번호/생년월일) 누락 시 에러
- 중복 계정(`duplicateAccount`): 상태/액션은 정의되어 있으나 현재 코드 경로에서는 미분기 — 백엔드 결과 확장 시 연결 예정

#### Step 2: 회원정보입력

**뷰**:
- 인증된 본인정보 카드(이름/전화번호/생년월일/성별, 읽기 전용) + "다시 인증" 버튼(`history.back()`)
- 이메일 필드 (중복확인 + 인증코드 검증)
- 비밀번호 / 비밀번호 확인
- 닉네임 필드 (중복확인)
- 약관 동의 섹션
- "가입하기" 버튼

**필드별 검증 동작**:

| 필드 | 검증 | 제출 활성화 조건 |
|---|---|---|
| 이메일 | 1) 중복확인(`available`), 2) 인증코드 발송→검증 2단계. 이메일 변경 시 인증 초기화. `emailVerified` hidden | `isEmailVerified` |
| 닉네임 | 중복확인(`available`). 값 변경 시 검증 무효화. `usernameVerified` hidden | `isUsernameVerified` |
| 비밀번호 | Zod 스키마(8~16자, 영문 대소문자/숫자/특수문자 2가지+) — 클라이언트값만 들고 서버로 hidden 아님 | (폼 제출 시 서버 검증) |
| 본인정보 | hidden input 으로 `niceRequestNo`/`niceWebTransactionId`/name/phone/birthDate/gender 전달 | (Step 1 인증 완료 전제) |

**제출 비활성화 조건**: 이메일 인증 미완료 OR 닉네임 중복확인 미완료 OR 제출 진행중(`isPending`). 하단에 미완료 항목 안내 문구 표시.

**약관 동의**:
- [필수] 이용약관, [필수] 개인정보 수집 및 이용 — "내용 보기" 클릭 시 Dialog 로 전문 표시
- [선택] 광고성 정보 수신 — "펼치기/접기" 로 이메일/SMS/SNS 하위 토글. 마케팅 전체 동의 시 하위 동기화, 하위 개별 변경 시 전체 상태 재계산
- "모두 동의합니다" 체크박스로 일괄 토글
- 동의 값은 hidden input(`privacyAgree`/`marketingAgree`/`emailAgree`/`smsAgree`/`snsAgree`)으로 Server Action 전달

**제출 흐름** (`signUpAction` Server Action):
1. FormData → Zod 스키마 검증. 필드별 에러 매핑(email/username/password/nice/일반)
2. `postApiAuthSignup` 호출
3. 백엔드 400 중 NICE 관련 키워드 포함 시 "본인인증 정보가 만료되었거나 유효하지 않습니다. 다시 인증해주세요." 별도 안내
4. 성공 시 `redirect("/sign-in?registered=true")` — 강제 리다이렉트, `isRedirectError` 재throw

### /find-password — 비밀번호 초기화

클라이언트 상태 기반 4단계 폼. URL 동기화 안 함. Server Action 2개로 구성.

**단계 전이** (`idle → code-sent → resetting → completed`):
- `idle`: 이메일 입력 + "인증코드 발송" 버튼
- `code-sent`: 인증코드 입력 필드 노출 + "확인" 버튼. 이메일 입력 수정 시 `idle` 로 강제 리셋(코드/에러 초기화)
- `resetting`: 검증중(코드 입력 readonly)
- `completed`: "임시 비밀번호를 이메일로 발송했습니다." + "로그인으로 돌아가기" 링크(`/sign-in`)

**흐름**:
1. 이메일 입력 → `sendResetCode` Server Action → `postApiAuthEmailVerificationResetSend`
   - 미가입 이메일 응답은 "가입되지 않은 이메일입니다" 로 정규화
2. 인증코드 입력 → `verifyAndResetPassword` Server Action
   - 1) `postApiAuthEmailVerificationResetVerify` (코드 검증)
   - 2) `postApiAuthResetPassword` (임시 비밀번호 발급) — 2단계 순차 호출. 검증 통과 후 발급 실패 시 별도 에러
3. 완료 시 임시 비밀번호 이메일 발송 안내

**버튼 비활성화 조건**:
- 인증코드 발송: 진행중 OR `code-sent` OR `resetting` 상태
- 코드 확인: 진행중 OR 코드 빈 값

### /nice/callback — NICE 본인인증 콜백 ⚠️ 특수

**목적**: NICE 인증 팝업이 인증 완료 후 리다이렉트되는 창. 사용자에게 보이는 화면이 아님 — 부모 창(sign-up 페이지)으로 결과를 전달하고 즉시 자가 닫힘.

**특수 동작**:
- 라우트 그룹 `(main)` 밖 `/app/nice/callback` 에 위치 — 인증 레이아웃/그룹 레이아웃 타지 않음
- 마운트 시 `useEffect` 1회 실행:
  1. URL 에서 `niceSessionId` 추출. 없으면 에러 로그 + `window.close()`
  2. `niceSessionId` 로 `BroadcastChannel(nice-verification-{sessionId})` 생성
  3. URL 에서 `web_transaction_id` 추출
  4. `web_transaction_id` 없으면 에러 메시지 post 후 `window.close()`
  5. 있으면 `nice-verification-success` 메시지(`webTransactionId`) post
  6. 채널 닫고 `window.close()` — 팝업 자가 종료
- 렌더링은 "본인인증 결과를 확인하고 있습니다." 로딩 문구만 — 실제 사용자 상호작용 없음

**부모 연동**: sign-up Step 1 의 `useNiceVerification` 이 동일 채널명으로 리스닝. 성공 메시지 수신 시 백엔드에서 인증 결과 조회 후 funnel 다음 단계로 전환.

## 데이터 흐름 (개요)

- sign-in: NextAuth `signIn("credentials")` 클라이언트 호출. `redirect: false` 로 직접 결과 핸들링
- sign-up: Server Action(`signUpAction`) → Orval API(`postApiAuthSignup`). NICE 세션/결과 조회는 클라이언트에서 Orval API 직접 호출
- find-password: Server Action 2개(`sendResetCode`, `verifyAndResetPassword`) → Orval API
- nice/callback: 백엔드 API 미호출 — URL 파라미터 → BroadcastChannel 메시지 전달만
- 토큰/에러 핸들링: 일반 API는 mutator가 일괄 처리하나, 인증 라우트는 NextAuth + 직접 fetch 혼재
- 모든 변경 액션은 Zod 스키마(`schemas.ts`) 기반 서버 검증

## 외부 의존

- **인증**: NextAuth.js v4 — Credentials/Google/Kakao/Naver 프로바이더. 페이지 폼은 Credentials 전용
- **본인인증**: NICE 평가정보 — 팝업 기반, `authUrl`/`requestNo`/`webTransactionId` 흐름
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트)
- **약관**: `TERMS_TEXT` (`@/lib/terms`) — 이용약관 전문

## 참고

- 코드 구조 탐색: `graphify query "sign-up funnel nice verification"` / `codegraph_explore "sign-up"`
- NICE 채널 명명 규칙: `nice-verification-{sessionId}` — 부모/콜백 간 합의
