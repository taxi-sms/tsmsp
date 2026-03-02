# Step 3: Stripe Webhook（契約状態の自動更新）

このStepは「支払いイベントを受けて、契約状態を自動でDB反映」する部分です。  
まだSQL Editorを実行していなくても、先にファイルだけ準備してOKです。

## 追加済みファイル
- `supabase/step3-stripe-webhook.sql`
- `supabase/functions/stripe-webhook/index.ts`

## 全体像（超短く）
1. StripeがWebhookを送る  
2. Supabase Edge Functionが受ける  
3. `apply_subscription_webhook` を呼ぶ  
4. `billing_subscriptions` が更新される

## 先にやること（SQLは後でOK）
1. Edge Functionをデプロイ
2. StripeのWebhook送信先を設定
3. 最後にSQL（Step2 → Step3）を流す

## 1. Edge Functionデプロイ
```bash
supabase functions deploy stripe-webhook
```

## 2. 必要なSecrets設定
```bash
supabase secrets set SUPABASE_URL=https://<project-ref>.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
supabase secrets set STRIPE_SECRET_KEY=<stripe-secret-key>
supabase secrets set STRIPE_WEBHOOK_SECRET=<stripe-webhook-signing-secret>
```

## 3. Stripe側Webhook設定
送信先URL:
```text
https://<project-ref>.functions.supabase.co/stripe-webhook
```

購読するイベント（最低限）:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `checkout.session.completed`

## 4. SQL反映（理解できるタイミングで）
以下の順でSQL Editorへ実行:
1. `supabase/step2-subscription-rls.sql`
2. `supabase/step3-stripe-webhook.sql`

## 5. テスト時の重要ポイント
- Stripeの `subscription` または `customer` の metadata に  
  `tsms_user_id=<Supabase auth.users.id>` を入れてください。  
  これでWebhookが「どのユーザーの契約か」を特定できます。

## 6. よくあるハマりどころ
- `missing_env`:
  Secrets未設定です。
- `invalid_signature`:
  `STRIPE_WEBHOOK_SECRET` が違います。
- `apply_failed`:
  Step2/Step3 SQL未実行、または権限設定不整合の可能性が高いです。

## 7. このStepでまだやらないこと
- 画面側の課金ガード（契約無効時に編集不可にする）
- Checkout作成API
- 請求画面UI

これらは次Stepで実装します。

