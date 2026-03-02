-- Step 2: Subscription table + RLS (idempotent)
-- Run this in Supabase SQL Editor (project: production first on staging recommended).
--
-- Scope:
-- 1) Add per-user subscription contract table.
-- 2) Add subscription event audit table.
-- 3) Apply Row Level Security.
-- 4) Add RPC for reading current user's contract state.
--
-- Notes:
-- - This SQL does not change existing app logic.
-- - Write operations are expected from service_role (Stripe webhook worker).
-- - Authenticated users can read only their own contract rows.

begin;

create extension if not exists pgcrypto;

create table if not exists public.billing_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_code text not null default 'starter_monthly',
  status text not null default 'inactive',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_subscriptions_status_check
    check (
      status in (
        'inactive',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'incomplete',
        'unpaid'
      )
    )
);

create table if not exists public.billing_subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_subscriptions_status
  on public.billing_subscriptions(status);

create index if not exists idx_billing_subscriptions_period_end
  on public.billing_subscriptions(current_period_end);

create index if not exists idx_billing_subscriptions_customer
  on public.billing_subscriptions(stripe_customer_id);

create index if not exists idx_billing_subscriptions_subscription
  on public.billing_subscriptions(stripe_subscription_id);

create index if not exists idx_billing_subscription_events_user_created
  on public.billing_subscription_events(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_billing_subscriptions_updated_at on public.billing_subscriptions;
create trigger trg_billing_subscriptions_updated_at
before update on public.billing_subscriptions
for each row execute function public.set_updated_at();

alter table public.billing_subscriptions enable row level security;
alter table public.billing_subscription_events enable row level security;

drop policy if exists "billing_subscriptions_select_own" on public.billing_subscriptions;
create policy "billing_subscriptions_select_own"
on public.billing_subscriptions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "billing_subscription_events_select_own" on public.billing_subscription_events;
create policy "billing_subscription_events_select_own"
on public.billing_subscription_events
for select
to authenticated
using (user_id = auth.uid());

-- Keep writes server-side only.
revoke insert, update, delete on public.billing_subscriptions from anon, authenticated;
revoke insert, update, delete on public.billing_subscription_events from anon, authenticated;

grant select on public.billing_subscriptions to authenticated;
grant select on public.billing_subscription_events to authenticated;

create or replace function public.current_subscription_state()
returns table (
  user_id uuid,
  plan_code text,
  status text,
  is_active boolean,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with me as (
    select auth.uid() as uid
  )
  select
    m.uid as user_id,
    coalesce(bs.plan_code, 'starter_monthly') as plan_code,
    coalesce(bs.status, 'inactive') as status,
    coalesce(bs.status in ('trialing', 'active'), false) as is_active,
    bs.trial_ends_at,
    bs.current_period_end,
    coalesce(bs.cancel_at_period_end, false) as cancel_at_period_end
  from me m
  left join public.billing_subscriptions bs
    on bs.user_id = m.uid;
$$;

grant execute on function public.current_subscription_state() to authenticated;

comment on table public.billing_subscriptions
  is 'User contract state for SaaS billing. Updated by server webhook.';

comment on table public.billing_subscription_events
  is 'Webhook/audit event log for subscription changes.';

comment on function public.current_subscription_state()
  is 'Returns current authenticated user contract status (single-row).';

commit;

