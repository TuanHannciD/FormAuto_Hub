---
name: formauto-module-router
description: Route FormAuto Hub tasks to the correct module and architectural layer. Use when ownership may cross Auth, Users, CreditManagement, TopupOrders, Dashboard, FormProjects, AnswerRules, ResponseGeneration, Submissions, integrations, API, or EF Core layers. Do not write production code.
---

# Purpose

Prevent ownership drift before planning or implementation.

# Workflow

1. Restate task.
2. Identify affected module(s).
3. Identify owning layer: controller, service, DTO, EF Core, entity, integration, docs, or frontend-deferred.
4. List allowed file zones.
5. List forbidden file zones.
6. Identify contract and phase gates.

# Must Enforce

- Credit behavior belongs in `CreditManagement`.
- Google Forms behavior belongs in `Integrations.GoogleForms`.
- DTOs own API contracts.
- EF Core owns persistence access and migrations.
- Frontend framework remains Deferred.

