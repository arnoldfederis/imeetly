<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into imeetly. Here's a summary of every change made:

- **`instrumentation-client.ts`** (new) — Initializes PostHog client-side via Next.js 15.3+ instrumentation hook, with a `/ingest` reverse proxy, exception capture, and debug mode in development.
- **`next.config.ts`** — Added `rewrites` for the PostHog reverse proxy (`/ingest/*` → `https://us.i.posthog.com`) and `skipTrailingSlashRedirect: true`.
- **`.env.local`** — Set `NEXT_PUBLIC_POSTHOG_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`.
- **6 component files** updated with `posthog.capture()` calls, `posthog.identify()` on login, `posthog.captureException()` at error boundaries, and `posthog.reset()` on account deletion.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `login_email_submitted` | User submitted email to start OTP login | `components/login/login-form.tsx` |
| `login_google_clicked` | User clicked "Continue with Google" | `components/login/login-form.tsx` |
| `login_passkey_clicked` | User clicked passkey authentication | `components/login/login-form.tsx` |
| `login_otp_verified` | OTP verified successfully — user is identified here | `components/login/otp-form.tsx` |
| `login_otp_failed` | OTP verification failed | `components/login/otp-form.tsx` |
| `meeting_created` | Meeting successfully created (includes `source_type`) | `components/meetings/new/form.tsx` |
| `meeting_file_uploaded` | File uploaded for a meeting (includes `file_type`, `file_size_mb`) | `components/meetings/new/form.tsx` |
| `meeting_processing_retried` | User manually retried processing a failed meeting | `components/meetings/details/container.tsx` |
| `meeting_exported` | Meeting exported (includes `format`: pdf or markdown) | `components/meetings/details/container.tsx` |
| `action_item_toggled` | Action item toggled open/done (includes `new_status`) | `components/meetings/details/action-item-row.tsx` |
| `upgrade_dialog_opened` | Upgrade dialog shown (includes `reason`) | `components/billing/upgrade-dialog.tsx` |
| `checkout_started` | User initiated billing checkout (includes `plan_slug`, `billing_period`) | `components/billing/upgrade-dialog.tsx` |
| `account_deleted` | User successfully deleted their account | `components/settings/account/delete-account-section.tsx` |

## Next steps

We've built a dashboard and five insights to track the most important user behaviors:

- **Dashboard**: [Analytics basics](https://us.posthog.com/project/387394/dashboard/1482854)
- **Login Funnel** — email submission → OTP verified: [C3d5xY7P](https://us.posthog.com/project/387394/insights/C3d5xY7P)
- **Meetings Created Over Time** — daily meeting creation by source type: [5HgPrMzt](https://us.posthog.com/project/387394/insights/5HgPrMzt)
- **Upgrade Conversion Funnel** — upgrade dialog → checkout started: [xh9PUlmO](https://us.posthog.com/project/387394/insights/xh9PUlmO)
- **Upgrade Dialog Trigger Reasons** — breakdown of why the upgrade dialog opens: [ca1AUnwn](https://us.posthog.com/project/387394/insights/ca1AUnwn)
- **Active Users Who Created Meetings** — weekly unique users creating meetings: [1jBfwegx](https://us.posthog.com/project/387394/insights/1jBfwegx)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
