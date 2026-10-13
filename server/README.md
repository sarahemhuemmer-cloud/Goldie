# Goldie adapter preparation

`handleApi(req,res)` handles `/api/*`, returns `true` when handled, and makes no network requests. All operations return HTTP 503 `integration_not_connected`. `/api/status` additionally returns service descriptors, each `not_connected`. Credentials do not activate adapters in this version.

## Verified provider references

Read-only inspection of WeTime source confirms Supabase client/server integrations, OpenAI assistant, transcription and realtime handlers, and Google Places New (`src/lib/places.functions.ts`). WeTime supports other configurable AI providers too; this preparation uses its OpenAI paths. WeTime docs/muell-push-inbetriebnahme.md and supabase/migrations/20260903170000_push_devices.sql describe prepared Web Push / VAPID plus Supabase Cron/Edge Function infrastructure; they explicitly state that no scheduler or sender is active. Goldie follows this preparation, without activating delivery.

## Stage-two contracts (not implemented)

- `auth`: Supabase signup, verification, login, recovery, logout. Verify bearer JWT with Supabase; never derive identity from request body, local storage, or unsigned tokens.
- `sync`: CRUD records with authenticated user JWT under RLS. Subscribe to permitted changes, handle revisions/conflicts, and keep local preparation separate from account data.
- `sharing`: owners explicitly grant individual records to verified account UUIDs. Read/write permissions differ. Invitations need acceptance and revocation UX; no email-based self-claimed identity.
- `files`: owner uploads to UUID-prefixed private storage path. Shared download requires authorization against the document record grant before short-lived signed URLs are issued. Reject paths inconsistent with record ownership. No public bucket or public attachment URLs.
- `chat`: authenticated conversation members only. Database messages are the source of truth; realtime publication and channel authorization still need configuration and testing. External communication links must not claim delivery.
- `assistant`, `transcription`, `speech`, `realtime`: server OpenAI credentials only. Require authenticated user, request limits and explicit action confirmation. Start microphone capture on explicit user action only. Do not transmit account documents without the user's selected scope.
- `search`: authenticated server Google Places requests with bounded field masks, input limits and configured billing quotas. Search results must not claim verified accessibility absent evidence.
- `notifications`: explicit browser permission, HTTPS, per-user subscription table, authenticated subscription/revocation, scheduled server jobs, VAPID keys. Permission alone does not establish reliable delivery.

No provider keys or WeTime data were copied. The accompanying SQL is for an independent Goldie Supabase project, not WeTime. Its RLS, private storage and membership policies are preparation, not a deployed or database-tested backend. JS tests verify the adapter boundary and a pure record-permission helper; they do not prove SQL policy behavior. Before connecting services, run migrations in an isolated database and test two-user owner/read/write/revocation cases, chat membership removal, forged sender IDs and private storage paths using real JWTs. Identity and grant fields are immutable or owner-managed; no household-wide implicit visibility is granted.

Run tests with `node --test server/*.test.mjs`.
