# EVENT_AND_WEBHOOK_CONTRACTS

## Purpose

Control event and webhook design.

## Current Status

Eventing, webhooks, queues, and background job framework are Deferred for MVP unless explicitly approved.

## Confirmed Rules

- MVP top-up approval is manual.
- Payment gateway integration is Deferred.
- Webhook integration is Deferred.
- Background job processing is Deferred for MVP.
- Future background processing may use ASP.NET Core `BackgroundService`, Hangfire, Quartz.NET, or a queue worker, but no implementation is approved.

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
- Do not invent Google OAuth callbacks.
- Do not create AI provider webhook assumptions.
- Do not call Deferred integrations production-ready.

