# NCKH Admin-Only Access Design

## Intent

Restrict the existing NCKH Survey Module to authenticated users whose JWT role is `Admin`, across both the Next.js UI and ASP.NET Core API. This is an access-control change only; existing NCKH routes, DTOs, data, and Admin behavior remain intact.

## Goals

- Hide the NCKH dashboard navigation entry for non-Admins.
- Redirect non-Admins away from `/dashboard/nckh` and its nested/callback routes.
- Require the existing `Admin` role on every implemented `/api/v1/nckh` endpoint.
- Preserve normal authentication semantics: unauthenticated requests receive `401`; authenticated non-Admins receive `403`.
- Add focused regression coverage for API and UI access decisions.

## Non-goals and constraints

- No database, DTO, route, status, or business-workflow changes.
- No change to NCKH ownership/data filtering for Admins.
- No new role or permission value; use the existing `User.Role` values and JWT role claim.
- Preserve existing UI behavior for Admin users.

## Approach

Use the framework role policy at the controller boundary (`[Authorize(Roles = "Admin")]`) so every NCKH API action is protected server-side, and add a shared client-side role guard for the dashboard shell and NCKH pages. The API is the security authority; UI checks only control visibility and navigation. Tests will cover representative unauthenticated, User, and Admin paths plus direct URL protection.

## Acceptance

An authenticated User cannot see or use NCKH UI and receives `403` from every NCKH API endpoint; an unauthenticated caller receives `401`; an Admin can load and use the existing NCKH UI/API unchanged.
