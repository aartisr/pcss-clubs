# Club website request email setup

The Support Center submits requests to `POST /api/club-site-requests`. The server checks the signed-in school account, validates the form, and uses a replaceable `EmailProvider` adapter. Brevo and Resend adapters are included. **Email sending stays off until the server-only settings below are supplied.** No provider account, sender, or credential was created by this code change.

## Configure Brevo

1. Create a Brevo account on its Free plan. Confirm that the portal team may send request details through Brevo and that `pcss2robotics@pioneercss.org` is a monitored intake mailbox.
2. Register and verify a portal-controlled sender/domain in Brevo. Ask the domain owner to add the DNS records Brevo provides. Use a portal address such as `requests@pcssclubs.org`; do not use a school-owned address as the sender without its owner's authorization. [Brevo sender setup](https://developers.brevo.com/docs/getting-started-with-senders-and-domains).
3. Create a Brevo API key and put these values in **Vercel → Project → Settings → Environment Variables** for the deployment environment. Redeploy after changing them. Never prefix these names with `VITE_` or put the key in the repository.

   ```dotenv
   EMAIL_PROVIDER=brevo
   BREVO_API_KEY=YOUR_SERVER_ONLY_BREVO_KEY
   EMAIL_SENDER_EMAIL=requests@pcssclubs.org
   CLUB_SITE_REQUEST_RECIPIENT=pcss2robotics@pioneercss.org
   ```

   The recipient setting is optional; the address above is the code default. For local development, put the same settings in ignored `.env.local` and restart `npm run dev`. Do not use a real student request in a test environment.
4. Verify school sign-in on the canonical production host. With an eligible school account, submit one test request and confirm that the monitored inbox receives it. Test an anonymous request, a retry with the same form, and a temporarily disabled provider before inviting students.

The request service also requires `OIDC_REQUIRED_HOSTED_DOMAIN=pioneercss.org` alongside the working OIDC settings. The public `/api/club-site-requests` availability check returns `available: false` until both school sign-in and email delivery are configured. That check verifies configuration presence, not provider health or remaining quota. Existing `BREVO_SENDER_EMAIL` remains accepted as a compatibility fallback; use `EMAIL_SENDER_EMAIL` for new setups.

## If Brevo returns `401 unauthorized`

This means Brevo rejected the API credential before it checked the email content or sender. It cannot be fixed by asking the student to retry. The portal returns `EMAIL_SETUP_REQUIRED`, keeps the form on screen, and logs the provider status without the credential or message body.

1. In **Vercel → Project → Settings → Environment Variables**, confirm `EMAIL_PROVIDER=brevo` and that `BREVO_API_KEY` is a Brevo **v3 API key**, not an SMTP key or account password. Confirm it is assigned to **Production** and has no surrounding quotes or copied placeholder text. Save the corrected value and redeploy. Do not paste the key into a support message or log. [Brevo API authentication](https://developers.brevo.com/docs/how-it-works), [Brevo API key troubleshooting](https://help.brevo.com/hc/en-us/articles/40154686262546-Troubleshooting-Issues-with-API-keys).
2. If the key is **Restricted**, set **Transactional email → All**. Newly restricted keys begin with no permissions; Read can inspect email activity but cannot send. Also check Brevo's **Security → Authorized IPs** if blocking unknown API IPs is enabled. Either setting can reject a valid key from Vercel. [Brevo API key permissions](https://help.brevo.com/hc/en-us/articles/40158277171474-About-API-key-permissions), [Brevo IP security](https://developers.brevo.com/docs/ip-security).
   - **Vercel's default outbound IPs change.** With Brevo's **Block unknown IP addresses** enabled, a valid key can be rejected when the function uses a new IP. Vercel's static outbound IP option is paid, so it does not meet this portal's zero-budget constraint. To keep Brevo Free, the account owner can turn off **Block unknown IP addresses for API keys** while retaining the restricted key, **Transactional email → All**, and a server-only Vercel secret. This reduces one security layer and should be an explicit account-owner decision. The other zero-budget option is to select the already-supported Resend Free adapter after verifying its sender domain. Do not try to maintain a single Vercel IP in Brevo's allowlist. [Vercel outbound IP behavior](https://vercel.com/academy/optimize-your-vercel-account/backend-egress), [Brevo IP security](https://developers.brevo.com/docs/ip-security).
3. If you have the same key in a local, ignored `.env.local`, run `node --env-file=.env.local --import tsx scripts/check-brevo-connection.ts`. This makes a **read-only** request to Brevo's transactional email statistics endpoint; it does not send email or print the key or account data. A local success proves only read access from the local IP. Sending still needs Transactional email → All, and local success does not prove Vercel has the same key or IP access. After redeploy, submit one test request in Production and confirm both the API response and receipt in the monitored inbox. [Brevo transactional statistics endpoint](https://developers.brevo.com/reference/get-aggregated-smtp-report).

## Switch providers

Change only server environment variables; the form and request handler stay the same. To use [Resend Free](https://resend.com/pricing), verify a portal-controlled sending domain there, then set:

```dotenv
EMAIL_PROVIDER=resend
RESEND_API_KEY=YOUR_SERVER_ONLY_RESEND_KEY
EMAIL_SENDER_EMAIL=requests@pcssclubs.org
CLUB_SITE_REQUEST_RECIPIENT=pcss2robotics@pioneercss.org
```

Redeploy after changing the provider. Resend Free has its own daily and monthly limits. The shared contract includes sender, recipient, Reply-To, subject, plain-text body, and idempotency key; adding another provider requires one adapter and one registration in `src/server/email/config.ts`. Never fall back to a second provider automatically after an uncertain send: the first provider may have accepted it, and a cross-provider retry could duplicate the request.

## What happens at the free limit

Brevo documents **300 sends per day** on its Free plan. After that, it may hold **up to 1,000 additional transactional emails** in its retry queue; messages beyond that are not delivered. The Free plan's **Sent with Brevo** mark applies to all its emails. These are Brevo account rules, not numbers the portal can safely count or override. [Brevo Free limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan).

The portal sends **one** admin notification per request. It does not switch modes after 300, remove branding, promise 1,300 same-day deliveries, or maintain a local counter that could disagree with Brevo. Brevo's API may accept a message that will be queued; the site therefore says only that the request was **passed to the email service**. When a provider explicitly reports a quota or rate limit, the API returns `429`, passes a bounded `Retry-After` header when available, and tells the student to try later while keeping their answers. Credential, permission, account-validation, and invalid-payload errors return `EMAIL_SETUP_REQUIRED` so students are directed to the portal team; transient failures return `EMAIL_UNAVAILABLE`. A stable idempotency key helps prevent duplicate messages on a retry. [Brevo API](https://developers.brevo.com/docs/send-a-transactional-email), [Brevo idempotency](https://developers.brevo.com/changelog/2021/11/10), [Resend idempotency](https://resend.com/changelog/idempotency-keys).

**Zero-budget boundary:** keep the provider account on its Free plan and do not enable paid add-ons or automatic upgrades. Provider limits, rather than a local process counter, are the current spending guard. The site cannot detect an accepted Brevo message that is later dropped after its 1,000-message queue fills. A hard guarantee of no lost requests needs shared durable storage plus delivery events and a global quota policy; do not claim one until those components are deployed. [Brevo Free limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan), [Brevo webhooks](https://developers.brevo.com/docs/transactional-webhooks).

## Component boundaries

| Component | Responsibility |
| --- | --- |
| `src/hooks/useClubSiteRequest.ts` | Submit once, reuse an ID on a retry, preserve form and show a safe error. |
| `src/server/clubSiteRequests.ts` | Check origin and server session, validate fields, derive the school identity, format the notification, return an honest result. |
| `src/server/email/provider.ts` | Small provider interface and delivery error types. |
| `src/server/email/brevo.ts`, `resend.ts` | Provider HTTP requests; no provider code in the UI. |
| `src/server/email/config.ts` | Choose a provider through server environment settings; fail closed if incomplete. |
| `api/club-site-requests.ts` and `src/server/index.ts` | Vercel and local Express entrypoints for the same handler. |

The browser cannot choose the recipient, sender, account identity, or provider key. The request email uses plain text and labels student-entered details as unverified. No shared request database or delivery webhook exists yet. The reference shown after an accepted API response helps locate the email; it is **not** a durable ticket record. Logs use that reference plus provider, status and short provider error code; they omit the student email, message body and API key. For guaranteed tracking and delayed-delivery alerts, add the database/outbox phase described in [automated request options](automated-club-site-requests.md).

The current pilot has no shared per-account rate limiter. School-account authorization and Brevo's free-plan cap limit exposure, but a shared abuse counter and durable request log should be added before broad promotion.
