# Step 2: Supabase契約テーブル + RLS

この手順は、`step2-subscription-rls.sql` を安全に反映するための実行ガイドです。

## 1. 事前準備
- Supabaseの対象プロジェクトを開く
- 先にステージング環境で試す
- 既存バックアップを取得する（念のため）

## 2. SQL実行
1. Supabase Dashboard > SQL Editor を開く
2. `supabase/step2-subscription-rls.sql` の中身を貼り付ける
3. 実行する

## 3. 反映確認（そのまま実行）
```sql
-- テーブル確認
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('billing_subscriptions', 'billing_subscription_events')
order by table_name;

-- RLS有効確認
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('billing_subscriptions', 'billing_subscription_events')
order by tablename;

-- 関数確認
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'current_subscription_state';
```

## 4. 動作確認（ログイン後）
まずSQL Editorで、テストユーザーの契約データを1件作る（service role側作業想定）:
```sql
insert into public.billing_subscriptions (user_id, plan_code, status)
values ('<auth.users.id>', 'starter_monthly', 'active')
on conflict (user_id) do update
set plan_code = excluded.plan_code,
    status = excluded.status,
    updated_at = now();
```

次にアプリへログインした状態で、ブラウザ開発者コンソールで以下を実行:
```js
const mod = await import("./supabase-client.js");
const { data, error } = await mod.supabase.rpc("current_subscription_state");
console.log({ data, error });
```

`is_active = true` が返ればStep2完了です。

## 5. 注意点
- このStepでは「契約状態をDBで保持する基盤」までです。
- 画面側で契約状態に応じて機能制限するのは次Stepです。
- Stripe webhook連携（契約状態の自動更新）も次Stepで実装します。
