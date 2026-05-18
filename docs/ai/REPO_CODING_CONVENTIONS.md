# REPO_CODING_CONVENTIONS

## Purpose

Define coding conventions for future implementation.

## Current Status

Initial Phase 1 backend scaffold exists. These conventions apply to all future implementation work.

## General Rules

- Prefer simple, readable code.
- Keep changes scoped.
- Avoid broad refactors during feature work.
- Do not add abstractions before real duplication or complexity exists.
- Use comments only when they clarify non-obvious behavior.

## ASP.NET Core Rules

- Keep controllers thin.
- Use DTOs for request/response contracts.
- Do not expose EF Core entities directly.
- Keep business logic in services.
- Keep provider calls in integration services.
- Keep persistence in EF Core `DbContext` and repositories/services as approved.

## Naming Rules

- Use PascalCase for C# types and public members.
- Use camelCase for local variables and parameters.
- Use clear module names matching `MODULE_MAP.md`.
- Use explicit names for credit and ledger operations.

## Refactor Rules

- Do not refactor unrelated modules.
- Do not move ownership boundaries without documentation updates.
- Do not introduce shared packages or frontend structure before approval.

## Contract Rules

- DTO changes require API contract review.
- Entity changes require database review.
- Status changes require lifecycle review.
