-- 2026-10 고객 수정 요청 반영: NEW 표시 기간, 5개 단위 수량, 혼합 색상, 자주 묻는 질문, 1:1 문의

alter table public.products add column if not exists qty_step int not null default 1 check (qty_step >= 1);
alter table public.products add column if not exists released_at timestamptz;
alter table public.product_colors add column if not exists is_mix boolean not null default false;

-- ───────── 자주 묻는 질문 ─────────
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null default '그 외',
  question text not null,
  answer_html text not null default '',
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ───────── 1:1 문의 ─────────
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default '',
  order_no text not null default '',
  title text not null,
  body text not null default '',
  attachments jsonb not null default '[]',
  status text not null default 'waiting' check (status in ('waiting', 'answered')),
  answer_html text not null default '',
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_user on public.inquiries (user_id, created_at desc);

alter table public.faqs enable row level security;
alter table public.inquiries enable row level security;

create policy faqs_public_read on public.faqs for select using (is_visible or public.is_admin());
create policy faqs_admin_write on public.faqs for all using (public.is_admin()) with check (public.is_admin());

-- 1:1 문의: 본인 작성·읽기, 답변은 관리자
create policy inquiries_owner_insert on public.inquiries for insert with check (user_id = auth.uid());
create policy inquiries_owner_read on public.inquiries for select using (user_id = auth.uid() or public.is_admin());
create policy inquiries_admin on public.inquiries for all using (public.is_admin()) with check (public.is_admin());
