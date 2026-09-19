# Accounts and the mailing list

Operator notes for the optional account. The system is a port of CropASAP's
(`cropasap/src/{supabase,account,consent}.ts` and `cropasap/docs/accounts.md`);
keep the two in step until they are consolidated into a shared package.

## Where accounts live

Keygrove uses the **shared Strange Systems Supabase project** —
`fhedwkbaujiivemneefg` — the same one behind CropASAP, No Ceremony and
AIfoodpal. One login works across all of them, and `auth.users` is one list of
people. The browser-safe URL and publishable key are committed in
`src/state/supabase.ts`; a build can point elsewhere with `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY` (wired through `define` in `vite.config.ts`).

Nothing is loaded for a guest: `@supabase/supabase-js` is split into its own
chunk by Vite (a dynamic `import()` in `loadClient`) and fetched only on
Sign in, a stored session, or an emailed link. Guest pages make no request
after load.

Keygrove progress still lives in this browser (`src/state/save.ts`); the
account does not sync it yet. That is a follow-up, modelled on
`cropasap_sizes` (one revisioned JSON row per user, `keygrove_` prefix).

## Consent

The marketing box is unchecked, worded separately from the account, and stored
in the user's auth metadata (`src/state/consent.ts`), with the same keys and
sentence every Strange Systems app uses:

| key | value |
| --- | --- |
| `marketing_opt_in` | `true` / `false` |
| `marketing_opt_in_at` | ISO time of the tick, `null` when off |
| `marketing_source` | `keygrove` |
| `marketing_consent_text` | the sentence they ticked |

The person can change it any time from **Your account**. Export the list from
the SQL editor (it covers every app's opt-ins; `source` says which app asked):

```sql
select email,
       raw_user_meta_data->>'marketing_opt_in_at' as opted_in_at,
       raw_user_meta_data->>'marketing_source'    as source
from auth.users
where raw_user_meta_data->>'marketing_opt_in' = 'true'
  and email_confirmed_at is not null
order by opted_in_at;
```

Only ever mail confirmed addresses, and honour the box: an unticked box is an
unsubscribe.

## Dashboard steps for Keygrove

1. **Redirect URLs** (Authentication → URL Configuration): add Keygrove's
   production origin and `/**` under it, the way `https://cropasap.vercel.app/`
   and `https://cropasap.vercel.app/**` are listed. Until then a confirmation
   or reset link lands on the project's site URL (AIfoodpal) instead of here.
2. Everything else — custom SMTP, scanner-proof `{{ .TokenHash }}` links, the
   built-in mailer's rate limit — is shared project state and is tracked in
   `cropasap/docs/accounts.md`.

## Gmail opens the link first

Gmail's link scanner fetches the one-time confirmation link before the person
clicks, which confirms the account and spends the token, so their own click
lands on `?error_code=otp_expired`. The account is fine; `ui/account.ts`
(`linkProblem`) explains this and puts the sign-in form up, and password
sign-in succeeds.
