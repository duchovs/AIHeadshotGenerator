You are helping refactor a Node+Express + Supabase project (using Passport.js for Google OAuth) to implement Stripe-backed token purchases. The database schema now includes:

- A `payments` table (to record Stripe sessions/charges)
- A `tokenTransactions` table (to record every token credit or debit)
- A `tokenBalance` column on `users`

Your tasks:

1. **Stripe Integration**  
   - Create three Stripe Price objects ($10→10, $25→30, $50→70 tokens) if not already created.
   - Implement an Express route `POST /api/stripe/create-checkout-session`:
     - Authenticated via Passport.js.
     - Accepts `{ priceId }`, creates a Stripe Checkout Session, saving `session.id` and `user.id` in `payments`, and returns the session URL.  
   - Secure the route so only logged-in users can call it.

2. **Webhook Handling**  
   - Implement `POST /api/stripe/webhook`:
     - Validate webhook signature.
     - On `checkout.session.completed`, look up `payments.session_id`, ensure idempotency.
     - Credit tokens: insert into `tokenTransactions` (+N tokens), update `users.tokenBalance`.
     - Mark payment as fulfilled.

3. **Token Deduction**  
   - Wrap every action that costs tokens (e.g. model training or image generation) in middleware:
     - Check `users.tokenBalance >= cost`.
     - Deduct tokens in a transaction: insert a negative `tokenTransactions` record and decrement `tokenBalance`.
     - Reject if insufficient.

4. **Real-Time Balance Display**  
   - In your Vite+React frontend, wire up a secure API route `GET /api/user/token-balance`:
     - Responds with the current `tokenBalance`.
   - In `Header.tsx`, fetch balance on mount and subscribe to changes:
     - After a successful purchase (on redirect back) or after generation train calls, re-fetch and update via context or state.
     - Display `Token Balance: {balance}` prominently.

5. **Security & Conventions**  
   - Use Passport.js middleware (`ensureAuthenticated`) on all token/payment routes.  
   - Use parameterized queries or Supabase’s client library to avoid injection.  
   - Handle errors gracefully, returning clear JSON error codes (e.g. `403` if not authenticated or `402` if insufficient tokens).

6. **Schema Awareness**  
   - Refer to `schema.ts` for exact column/table names and types.  
   - Keep naming consistent (e.g. `token_transactions`, `payments`, `token_balance`).

7. **Testing & Idempotency**  
   - Add unit/integration tests for:
     - Session creation route returns valid session URL.
     - Webhook only credits once per session.
     - Token deduction middleware blocks when balance is low.
   - Use Stripe CLI or testing keys to simulate webhooks locally.

Please refactor existing code and add new files/routes where needed, following these industry best practices. Prioritize security, maintainability, and clear code structure.  
