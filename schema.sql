-- ============================================================
-- 디저트 베이커리 예약·주문 SaaS — 초기 DB 스키마
-- Supabase SQL Editor 에 붙여넣어 실행하세요.
-- ============================================================

-- ---------- 확장 ----------
create extension if not exists "uuid-ossp";

-- ---------- 사장님(가게) ----------
create table shops (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete cascade unique not null,
  shop_name text not null,
  slug text unique not null,                 -- 주문 페이지 주소: /{slug}
  phone text,
  address text,
  intro text,                                -- 가게 소개
  profile_image_url text,
  -- 영업시간: {"mon":{"open":"10:00","close":"19:00"}, ...} 형식
  business_hours jsonb default '{}'::jsonb,
  pickup_slot_minutes int default 30,        -- 픽업 슬롯 단위(분)
  slot_capacity int default 3,               -- 슬롯당 동시 픽업 한도
  -- 구독
  subscription_status text default 'trial'   -- trial | active | past_due | cancelled
    check (subscription_status in ('trial','active','past_due','cancelled')),
  plan text default 'basic',
  trial_ends_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now()
);

-- ---------- 상품 ----------
create table products (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade not null,
  name text not null,
  description text,
  price int not null,                        -- 원 단위 정수
  images text[] default '{}',                -- 상품 사진 URL 배열
  lead_time_days int default 0,              -- 사전주문 필요 일수 (0=당일가능)
  daily_limit int,                           -- 일별 생산 한도 (null=무제한)
  max_quantity_per_order int default 5,
  -- 옵션: [{"name":"사이즈","choices":["1호","2호"]}, ...]
  options jsonb default '[]'::jsonb,
  allow_lettering boolean default false,     -- 레터링 가능 여부
  lettering_max_chars int default 20,
  is_active boolean default true,            -- 판매중 여부
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- 주문 ----------
create table orders (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade not null,
  order_number text unique not null,         -- 사람이 읽는 주문번호 (예: 20260523-001)
  -- 주문자(결제자)
  customer_name text not null,
  customer_phone text not null,
  -- 수령자 (선물용일 때 다름; 같으면 주문자 정보 복사)
  recipient_name text,
  recipient_phone text,
  -- 픽업
  pickup_date date not null,
  pickup_time text not null,                 -- "14:30" 형식 슬롯
  -- 주문 내역: [{"product_id":...,"name":...,"options":{...},"qty":1,"price":...}]
  items jsonb not null,
  lettering_text text,
  request_note text,                         -- 요청사항
  reference_image_url text,                  -- 디자인 참고 이미지
  total_amount int not null,
  -- 결제
  payment_status text default 'pending'      -- pending | paid | cancelled | refunded
    check (payment_status in ('pending','paid','cancelled','refunded')),
  payment_key text,                          -- 토스페이먼츠 결제키
  paid_at timestamptz,
  -- 진행 상태
  order_status text default 'received'       -- received | preparing | ready | completed | cancelled
    check (order_status in ('received','preparing','ready','completed','cancelled')),
  created_at timestamptz default now()
);

-- ---------- 휴무일/임시 마감 ----------
create table availability_overrides (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade not null,
  date date not null,
  status text not null                       -- closed | limited
    check (status in ('closed','limited')),
  note text,
  unique (shop_id, date)
);

-- ---------- 인덱스 ----------
create index idx_products_shop on products(shop_id);
create index idx_orders_shop on orders(shop_id);
create index idx_orders_pickup on orders(shop_id, pickup_date);
create index idx_overrides_shop_date on availability_overrides(shop_id, date);

-- ============================================================
-- Row Level Security (RLS)
-- 사장님은 자기 가게 데이터만 접근. 고객용 조회는 공개 정책 또는
-- 서버(서비스 롤 키)에서 처리.
-- ============================================================

alter table shops enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table availability_overrides enable row level security;

-- 사장님: 자기 shop row 만 읽기/수정
create policy "owner reads own shop" on shops
  for select using (auth.uid() = auth_user_id);
create policy "owner updates own shop" on shops
  for update using (auth.uid() = auth_user_id);
create policy "owner inserts own shop" on shops
  for insert with check (auth.uid() = auth_user_id);

-- 상품: 자기 가게 상품만 관리
create policy "owner manages own products" on products
  for all using (
    shop_id in (select id from shops where auth_user_id = auth.uid())
  );

-- 주문: 자기 가게 주문만 조회·수정
create policy "owner reads own orders" on orders
  for select using (
    shop_id in (select id from shops where auth_user_id = auth.uid())
  );
create policy "owner updates own orders" on orders
  for update using (
    shop_id in (select id from shops where auth_user_id = auth.uid())
  );

-- 휴무일: 자기 가게 것만 관리
create policy "owner manages own overrides" on availability_overrides
  for all using (
    shop_id in (select id from shops where auth_user_id = auth.uid())
  );

-- 참고: 고객(비회원)의 상품 조회와 주문 생성은
-- 서버 라우트에서 service_role 키로 처리하거나,
-- 공개 read 정책 + insert 정책을 별도로 추가하세요.
-- 예) 공개 상품 조회:
-- create policy "public reads active products" on products
--   for select using (is_active = true);
