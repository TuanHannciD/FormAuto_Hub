# EVENT_AND_WEBHOOK_CONTRACTS

## Purpose

Control event and webhook design.

## Current Status

Eventing, queues, and background job framework remain Deferred unless explicitly approved.

Phase 8 explicitly approves the PayOS payment webhook only for automated credit top-up.

## Confirmed Rules

- MVP top-up approval was manual before Phase 8.
- Phase 8 approves PayOS as the first payment provider for automated credit top-up.
- Phase 8 approves a PayOS payment webhook for verified payment handling.
- Background job processing is Deferred for MVP.
- Future background processing may use ASP.NET Core `BackgroundService`, Hangfire, Quartz.NET, or a queue worker, but no implementation is approved.

## PayOS Payment Webhook

Approved endpoint:

- `POST /api/payments/payos/webhook`
- Local/tunnel frontend proxy: the same path on the Next.js app may forward PayOS webhook requests to the backend API so admins can use one public frontend domain during smoke testing.

Provider:

- PayOS

Producer:

- PayOS payment system

Consumer:

- FormAuto Hub payment integration service
- Optional local/tunnel transport: FormAuto Hub Next.js proxy route, forwarding only

Purpose:

- confirm PayOS payment outcome for a top-up order
- grant credit only after verified payment handling
- support idempotent processing when PayOS retries webhook delivery

Payload baseline from official PayOS documentation:

- root fields include `code`, `desc`, `success`, `data`, and `signature`
- `data` includes values such as `orderCode`, `amount`, `description`, `reference`, `transactionDateTime`, `currency`, and `paymentLinkId`

Signature verification:

- required before applying any state change
- uses PayOS checksum key and HMAC-SHA256 verification
- invalid signatures must not grant credit
- the frontend proxy must not perform authoritative payment verification or grant credit; it only forwards the request to the backend API

Idempotency:

- use the PayOS order code and/or payment link id with provider name as the idempotency key
- repeated valid webhook delivery for an already-applied payment must not add duplicate credit
- repeated valid webhook delivery may return a 2xx response after safe no-op handling

State changes allowed after a valid paid webhook:

- update payment metadata
- update matching `TopupOrder` from `Pending` to `Approved`
- set paid/approved timestamps as appropriate
- call the dedicated credit workflow
- write a `CreditTransactions` ledger entry

Forbidden:

- do not grant credit from the PayOS return URL
- do not grant credit inside the frontend webhook proxy
- do not grant credit before signature verification
- do not grant credit if amount or order identity does not match the stored top-up order/payment record
- do not expose PayOS secrets in logs or admin UI
- do not implement refund automation from this webhook contract

Pending implementation review:

- exact DTO class names
- exact raw payload storage/redaction rule
- exact provider status mapping
- exact error and retry response behavior

## Google Forms Integration Notes

- MVP may use URL analysis and controlled HTTP form submission for simple public forms.
- Production direction should prefer official Google Forms API and OAuth when users own or are authorized to access the form.
- Google Forms API has quota/usage limits.
- Future production design must account for rate limits, retry, job queue, and validation honesty.

## Event Contract Rules

Before adding events, define:

- event name
- producer
- consumer
- payload
- idempotency behavior
- retry behavior
- failure handling
- audit/logging behavior

## Webhook Contract Rules

Before adding webhooks, define:

- provider
- endpoint
- authentication/signature verification
- payload schema
- retry behavior
- idempotency key
- replay handling
- logging and audit behavior

## Forbidden

- Do not invent payment webhooks.
- Do not add payment provider webhooks other than the approved PayOS Phase 8 webhook.
- Do not invent Google OAuth callbacks.
- Do not create AI provider webhook assumptions.
- Do not call Deferred integrations production-ready.
