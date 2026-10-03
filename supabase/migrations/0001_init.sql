-- TERRYWELL 초기 스키마
-- 로컬 모드(.data/db.json)와 같은 테이블·컬럼 이름을 쓴다. 바꿀 때는 src/lib/db/types.ts 도 함께 바꾼다.

create extension if not exists "pgcrypto";

-- ───────── 회원 ─────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  phone text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  company_name text not null default '',
  business_number text not null default '',
  created_at timestamptz not null default now()
);

-- 가입 시 profiles 자동 생성
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'name', ''),
          coalesce(new.raw_user_meta_data->>'phone', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ───────── 제품 ─────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ko text not null,
  category_slugs text[] not null default '{}',
  is_visible boolean not null default true,
  sort_order int not null default 0,
  images jsonb not null default '[]',          -- [{url, alt}]
  specs jsonb not null default '[]',           -- [{label, value}]
  spec_note text not null default '',          -- 예: * 수건 박스 별도 문의
  towel_size text not null default '',         -- 도식용 표기 예: 40×80cm
  detail_html text not null default '',
  detail_images jsonb not null default '[]',
  notice_html text not null default '',        -- 유의사항
  guide_html text not null default '',         -- 이용안내
  shipping_info jsonb not null default '[]',   -- [{label, value}]
  base_price int not null default 0,           -- 원, 공급가 기준
  vat_included boolean not null default false,
  allow_editor boolean not null default true,
  allow_upload boolean not null default true,
  -- 라벨 설정 (mm). 하드코딩 금지: 제품마다 관리자에서 설정
  label_width_mm numeric not null default 65,
  label_height_mm numeric not null default 45,
  label_bleed_mm numeric not null default 2,
  label_safe_mm numeric not null default 3,
  label_corner_mm numeric not null default 0,
  label_pages int not null default 1,
  allow_pages boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,                 -- peach, soda ...
  swatch text not null default '#ffffff',   -- 색 코드 또는 스와치 이미지 URL
  images jsonb not null default '[]',
  mockup_url text,                    -- 색상별 수건 목업
  -- 목업 위 라벨 부착 위치 (목업 이미지 대비 %)
  label_x numeric not null default 70,
  label_y numeric not null default 80,
  label_w numeric not null default 14,
  label_rotate numeric not null default 0,
  sort_order int not null default 0
);

create table public.product_price_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  min_qty int not null,
  unit_price int not null
);

create table public.product_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  kind text not null check (kind in ('guide', 'template')),   -- 제작 가이드 / 도안 파일
  name text not null,
  url text not null,
  created_at timestamptz not null default now()
);

-- ───────── 에디터 자원 ─────────
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '전체',
  product_id uuid references public.products(id) on delete set null,
  canvas_json jsonb not null,
  thumbnail_url text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.stickers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '전체',
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ───────── 고객 디자인 ─────────
create table public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid references public.product_colors(id) on delete set null,
  name text not null default '내 디자인',
  canvas_json jsonb not null,
  thumbnail_url text,
  print_png_url text,
  print_pdf_url text,
  print_cmyk_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.design_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  file_name text not null,
  file_size bigint not null,
  storage_path text not null,
  agreed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.wishlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid references public.product_colors(id) on delete set null,
  design_id uuid references public.designs(id) on delete set null,
  upload_id uuid references public.design_uploads(id) on delete set null,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);

-- ───────── 주문 ─────────
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  user_id uuid not null references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'producing', 'shipping', 'done', 'cancelled')),
  supply_amount int not null,
  vat_amount int not null,
  total_amount int not null,
  shipping_fee int not null default 0,
  recipient jsonb not null,            -- {name, phone, zip, address1, address2, memo}
  tax_invoice jsonb,                   -- {requested, company_name, business_number, ceo, email, ...}
  payment jsonb,                       -- 포트원 결제 결과
  tracking_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  color_name text,
  design_id uuid references public.designs(id) on delete set null,
  upload_id uuid references public.design_uploads(id) on delete set null,
  quantity int not null,
  unit_price int not null,
  line_amount int not null
);

-- ───────── 문의 · 공지 ─────────
create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  company text not null default '',
  name text not null,
  phone text not null,
  email text not null,
  product text not null default '',
  quantity text not null default '',
  due_date text not null default '',
  message text not null default '',
  attachments jsonb not null default '[]',
  status text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  admin_memo text not null default '',
  created_at timestamptz not null default now()
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body_html text not null default '',
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────── AI ─────────
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt text not null,
  style text not null default '',
  provider text not null default '',
  result_paths jsonb not null default '[]',
  success boolean not null default false,
  error text,
  cost_estimate numeric not null default 0,
  kst_date date not null default ((now() at time zone 'Asia/Seoul')::date),
  created_at timestamptz not null default now()
);
create index ai_generations_user_day on public.ai_generations (user_id, kst_date);

-- ───────── 사이트 설정 · 콘텐츠 (관리자 편집) ─────────
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.site_contents (
  key text primary key,          -- home.hero, home.cards, about.sections ...
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ───────── RLS ─────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_price_tiers enable row level security;
alter table public.product_files enable row level security;
alter table public.templates enable row level security;
alter table public.stickers enable row level security;
alter table public.designs enable row level security;
alter table public.design_uploads enable row level security;
alter table public.wishlists enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.quote_requests enable row level security;
alter table public.notices enable row level security;
alter table public.ai_generations enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_contents enable row level security;

-- 본인 프로필 (role 변경은 관리자만: 서버에서 service role 로 처리)
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy profiles_admin_all on public.profiles for all using (public.is_admin());

-- 공개 읽기 + 관리자 쓰기
do $$
declare t text;
begin
  foreach t in array array['categories','product_colors','product_price_tiers','product_files',
                           'stickers','notices','site_settings','site_contents'] loop
    execute format('create policy %1$s_public_read on public.%1$s for select using (true)', t);
    execute format('create policy %1$s_admin_write on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;
create policy products_public_read on public.products for select using (is_visible or public.is_admin());
create policy products_admin_write on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy templates_public_read on public.templates for select using (is_visible or public.is_admin());
create policy templates_admin_write on public.templates for all using (public.is_admin()) with check (public.is_admin());

-- 본인 데이터 + 관리자 전체
do $$
declare t text;
begin
  foreach t in array array['designs','design_uploads','wishlists','cart_items'] loop
    execute format('create policy %1$s_owner on public.%1$s for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin())', t);
  end loop;
end $$;

-- 주문: 고객은 읽기만 (생성·상태 변경은 서버에서 service role 로)
create policy orders_owner_read on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy orders_admin_write on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy order_items_owner_read on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy order_items_admin_write on public.order_items for all using (public.is_admin()) with check (public.is_admin());

-- 견적문의: 누구나 작성, 읽기는 본인·관리자
create policy quote_insert on public.quote_requests for insert with check (user_id is null or user_id = auth.uid());
create policy quote_read on public.quote_requests for select using (user_id = auth.uid() or public.is_admin());
create policy quote_admin on public.quote_requests for all using (public.is_admin()) with check (public.is_admin());

-- AI 로그: 본인 읽기만 (기록·횟수 검증은 서버 service role)
create policy ai_owner_read on public.ai_generations for select using (user_id = auth.uid() or public.is_admin());

-- ───────── Storage ─────────
insert into storage.buckets (id, name, public) values
  ('product-images', 'product-images', true),
  ('mockups', 'mockups', true),
  ('templates', 'templates', true),
  ('ai-images', 'ai-images', true),
  ('designs', 'designs', false),
  ('uploads', 'uploads', false)
on conflict (id) do nothing;

-- 공개 버킷: 누구나 읽기, 관리자만 쓰기 (ai-images 는 서버가 service role 로 저장)
create policy storage_public_read on storage.objects for select
  using (bucket_id in ('product-images', 'mockups', 'templates', 'ai-images'));
create policy storage_admin_write on storage.objects for all
  using (bucket_id in ('product-images', 'mockups', 'templates') and public.is_admin())
  with check (bucket_id in ('product-images', 'mockups', 'templates') and public.is_admin());
-- 비공개 버킷: 경로 첫 폴더 = user_id
create policy storage_private_owner on storage.objects for all
  using (bucket_id in ('designs', 'uploads') and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))
  with check (bucket_id in ('designs', 'uploads') and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
