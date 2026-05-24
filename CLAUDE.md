# CLAUDE.md — 오더레터(OrderLetter): 디저트 베이커리 예약·주문 SaaS

> 이 파일은 Claude Code가 매 세션 자동으로 읽는 프로젝트 가이드입니다.
> 작업 방향이 바뀌거나 새 규칙이 생기면 여기 업데이트하세요.

## 프로젝트 개요

**오더레터(OrderLetter)** 는 인스타그램으로 주문받는 디저트 베이커리(홈베이킹·케이크 공방)
1인 사장님을 위한 예약·주문·선결제 SaaS. 사장님은 자기 전용 주문 페이지(`/{slug}`)를 갖고,
고객은 회원가입 없이 픽업 시간을 골라 선결제하면 카카오 알림톡을 받는다.

**핵심 가치제안:** DM으로 주문받는 번거로움 + 노쇼 → 자동화된 예약·선결제로 해결

## 타겟 사용자

- 사장님(B2B 구독자): 홈베이킹/디저트 공방 1인 운영자, 인스타 팔로워 1천~1만
- 고객(B2C): 인스타에서 발견해 케이크/디저트를 주문하는 일반 소비자 (선물용 비중 높음)

## 기술 스택

- **프레임워크:** Next.js 14 (App Router) + TypeScript
- **스타일:** Tailwind CSS + shadcn/ui
- **DB·인증:** Supabase (PostgreSQL, Auth, Storage)
- **결제:** 토스페이먼츠 (TossPayments) — 선결제 100% 또는 50% 예약금
- **알림톡:** 솔라피(SOLAPI) — 카카오 알림톡 발송
- **로그인:** 카카오 OAuth (사장님만 로그인, 고객은 비회원)
- **배포:** Vercel
- **이미지 저장:** Supabase Storage (상품 사진, 레터링 시안)

## 자주 쓰는 명령어

```bash
npm run dev           # 개발 서버 (http://localhost:3000)
npm run build         # 프로덕션 빌드 (타입 오류 여기서 잡힘)
npm run start         # 빌드 결과 실행
npm run lint          # ESLint (next lint)
npm run format        # Prettier 자동 포맷
npm run format:check  # Prettier 검사만 (CI용)
```

- 테스트 러너는 아직 없음. 검증은 `npm run build`(타입+빌드)와 `npm run lint`로 한다.
- shadcn 컴포넌트 추가 시 `shadcn@latest` 금지 → `shadcn@2.1.8` 사용 (Next 14/Tailwind v3 호환).
- DB 스키마는 `schema.sql`을 Supabase SQL Editor에 직접 붙여넣어 적용한다(마이그레이션 툴 없음).
- 경로 별칭: `@/*` → 프로젝트 루트 (`@/lib/...`, `@/components/...`, `@/types/...`).

## 폴더 구조

```
app/
  (auth)/          # 사장님 로그인·가입
    login/
    signup/
  (dashboard)/     # 사장님 관리 화면 (로그인 필요)
    dashboard/     # 오늘/이번주 예약 현황
    products/      # 상품 등록·관리
    orders/        # 주문 관리
    settings/      # 영업시간·휴무일·구독
  (public)/        # 고객용 (로그인 불필요)
    [slug]/        # 사장님별 주문 페이지
      page.tsx           # 메뉴 목록
      [productId]/       # 상품 상세·주문
      checkout/          # 결제
      complete/          # 주문 완료
  api/
    payments/      # 토스페이먼츠 webhook·확인
    notifications/ # 솔라피 알림톡 발송
components/
  ui/              # shadcn 컴포넌트
lib/
  supabase/        # 클라이언트·서버 인스턴스
  tosspayments/    # 결제 헬퍼
  solapi/          # 알림톡 헬퍼
types/             # 공유 타입 정의
```

## 아키텍처 핵심 (여러 파일을 읽어야 보이는 큰 그림)

### Supabase 클라이언트 3종 — 용도별로 골라 쓴다 (이게 제일 중요)

`lib/supabase/`에 세 가지가 있고, **무엇을 쓰느냐로 보안 경계가 결정된다.**

- `server.ts` → `createClient()` : 서버 컴포넌트·서버 액션·라우트 핸들러용. 요청
  쿠키로 로그인 세션을 읽어 **RLS(`auth.uid()`)가 동작**한다. 사장님(로그인 사용자)
  데이터 접근의 기본값. cookie `set`이 막혀도 무시(세션 갱신은 미들웨어 담당).
- `client.ts` → `createClient()` : 브라우저('use client')용. 주로 카카오 OAuth 시작에 사용.
- `admin.ts` → `createAdminClient()` : `service_role` 키로 **RLS를 우회**. 고객(비회원)의
  상품 조회·주문 생성처럼 로그인 세션 없이 서버에서 처리할 때만. 파일 상단 `import "server-only"`로
  클라이언트 번들에 섞이면 빌드가 실패하도록 막혀 있다. **남용 주의** — RLS를 건너뛰므로
  꼭 필요한 비회원 경로에서만.

### 인증·세션 흐름

- `middleware.ts` → `lib/supabase/middleware.ts`의 `updateSession()`이 **매 요청마다** 세션을
  갱신하고 경로 보호를 한다. `PROTECTED_PREFIXES`(`/dashboard /products /orders /settings`)는
  비로그인 시 `/login?next=...`로, `AUTH_ROUTES`(`/login /signup`)는 로그인 상태면 `/dashboard`로.
  환경변수(SUPABASE URL/ANON)가 없으면 세션 갱신을 건너뛰어 앱이 죽지 않게 한다.
  ⚠️ `createServerClient`와 `getUser()` 사이에 다른 코드를 넣지 말 것(세션 갱신 보장).
- 로그인: `components/auth/kakao-login-button.tsx`(브라우저)에서 카카오 OAuth 시작 →
  카카오 인증 후 `app/auth/callback/route.ts`로 복귀 → `exchangeCodeForSession`으로 세션 쿠키 생성 →
  `next`(앱 내부 경로만 허용, 오픈 리다이렉트 방지)로 이동.

### DB 스키마와 타입 동기화

- 스키마 원본은 `schema.sql`(테이블 + RLS 정책). `types/database.ts`는 **수기 작성**이며
  스키마를 바꾸면 **직접 맞춰 수정**해야 한다(또는 `npx supabase gen types typescript ...`로 재생성).
  편의 별칭 export: `Shop`, `Product`, `Order`, `AvailabilityOverride`, `Waitlist`.
- RLS 모델: 사장님은 `auth.uid() = shops.auth_user_id` 기준 자기 가게 데이터만 접근.
  `waitlist`는 anon insert만 허용(명단 조회 불가). **고객용 공개 상품 조회/주문 insert 정책은
  아직 미적용** — `schema.sql` 하단에 주석 예시가 있고, 당장은 `admin.ts`로 처리한다.

### 현재 실제 구현 상태 (문서의 로드맵과 코드의 차이)

랜딩(`app/page.tsx`) + 사전신청(`app/actions.ts` → `waitlist`) + 카카오 로그인까지가 동작한다.
나머지 대시보드/상품/주문/공개 페이지(`(public)/[slug]/...`)와 결제·알림 API
(`app/api/payments`, `app/api/notifications`)는 **스텁**("준비 중" 또는 501)이다.
파일이 존재한다고 구현된 것으로 가정하지 말 것.

## 도메인 규칙 (중요 — 디저트 특화 로직)

1. **사전주문 마감일(lead_time_days):** 상품마다 다름. 케이크는 보통 3일 전,
   마카롱·쿠키는 당일 가능. `pickup_date - today >= lead_time_days` 일 때만 주문 가능.
2. **일별 생산 한도(daily_limit):** 상품마다 하루 만들 수 있는 수량 제한.
   해당 날짜의 확정 주문 합계가 한도에 도달하면 그 날짜는 그 상품에 한해 마감.
3. **픽업 시간 슬롯:** 영업시간 내 30분 단위. 슬롯별 동시 픽업 한도 둘 수 있음.
4. **수령자 분리:** 주문자(결제자)와 수령자가 다를 수 있음 (선물용). recipient 필드 별도.
5. **레터링:** allow_lettering=true 인 상품만 글자 입력 가능, lettering_max_chars 로 제한.
6. **휴무일/임시마감:** availability_overrides 테이블로 특정 날짜 closed/limited 처리.
7. **결제 상태 흐름:** pending → paid → (preparing → ready → completed) | cancelled | refunded

## 코딩 컨벤션

- 모든 UI 텍스트는 한국어. 날짜·시간은 한국 표준(KST), 통화는 원(₩).
- 서버 컴포넌트 우선, 인터랙션 필요한 곳만 'use client'.
- DB 접근은 항상 lib/supabase 의 서버 클라이언트 사용. RLS(Row Level Security) 켜기.
- 금액은 정수(원 단위)로 저장. 소수점·부동소수 쓰지 않기.
- 폼 검증은 zod + react-hook-form.
- 에러 메시지는 사용자 친화적 한국어로 ("결제에 실패했어요. 잠시 후 다시 시도해주세요").
- 모바일 우선 반응형 (대부분 폰으로 접속).

## 보안·법적 주의

- 고객 전화번호 등 개인정보 수집 → 개인정보처리방침 페이지 필수.
- RLS로 사장님은 자기 가게 데이터만 접근 가능하게 강제.
- 토스페이먼츠 시크릿 키, 솔라피 키는 절대 클라이언트에 노출 금지 (서버 환경변수만).
- 결제 검증은 반드시 서버에서 (금액 위변조 방지).

## 작업 방식 요청

- 큰 기능은 한 번에 다 만들지 말고 단계로 쪼개서 진행하고, 중간중간 확인받기.
- 환경변수가 필요하면 .env.local 에 무엇을 넣어야 하는지 명확히 알려주기.
- 외부 서비스(토스·솔라피·카카오) 연동 시 어떤 콘솔에서 무엇을 설정해야 하는지 안내하기.
- 새 의존성 설치 전 왜 필요한지 한 줄로 설명하기.

## 현재 진행 단계

- [x] (출시 전) 랜딩 페이지 + 베타 사전 신청(waitlist)
  - app/page.tsx (CSS Module + next/font: Fraunces·Gowun Batang·Gowun Dodum)
  - 사전 신청 폼 → Server Action(app/actions.ts) → Supabase waitlist 테이블
- [ ] 1주차: 프로젝트 셋업, Supabase 연결, 카카오 로그인, 사장님 가입·가게등록
  - [x] 프로젝트 셋업 (Next.js 14, Tailwind, shadcn/ui, ESLint·Prettier, 폴더 구조)
  - [x] Supabase 연결 (서버/클라이언트/관리자 클라이언트, 세션 미들웨어, DB 타입)
  - [x] 카카오 OAuth 로그인 (코드 완성: login/signup, 콜백 라우트, 대시보드 보호 미들웨어)
    - ⚠️ 실제 로그인은 보류: Supabase가 account_email scope를 항상 요청 → 카카오 동의항목 미설정으로 KOE004.
      그동안 **임시 이메일+비밀번호 로그인** 사용 중(app/(auth)/actions.ts, EmailAuthForm). 카카오 버튼은 "준비 중" 비활성.
      이메일 동의 풀리면 KakaoLoginButton의 disabled prop 제거 + 임시 이메일 로그인 제거하면 전환됨.
  - [x] 사장님 가입·가게등록 (가게명·slug·전화·소개·영업시간 → shops insert)
    - 온보딩 페이지 app/(dashboard)/onboarding, ShopSetupForm(zod+RHF), slug 실시간 중복체크(/api/shops/check-slug).
    - 게이팅: 가게 없으면 /dashboard→/onboarding, 가입 직후 /onboarding 으로.
- [ ] 2주차: 상품 등록, 시간슬롯, 고객 주문 페이지
- [ ] 3주차: 토스페이먼츠 결제, 솔라피 알림톡, 취소·환불
- [ ] 4주차: 대시보드, 모바일 점검, 베타 배포

> 진행하면서 완료한 항목은 [x]로 체크하고, 새로 정한 규칙은 위 섹션에 추가하세요.

## 한국어로 답하기

- 응답은 항상 한국어로.
- 코드 바꾸기 전에 무엇을 바꿀지 한국어로 먼저 한 줄 설명한 다음에 손대.
- 파일 지우는 명령은 실행 전에 한 번 물어봐.