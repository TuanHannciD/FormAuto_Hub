# FormAuto Hub server-debugger references

Read only the references needed for the current production check:

- `docker-compose.prod.yml`: authoritative Compose services, health checks, internal ports, host bindings, volumes, and default public URLs.
- `scripts/deploy-production.sh`: exact release deployment smoke checks and `.deploy/current-release` behavior. Read only; never execute under this skill.
- `docs/ai/DEPLOYMENT_GUIDE.md`: production topology, paths, health checks, logs, reverse proxy, and troubleshooting.
- `docs/ai/TECH_STACK_DECISIONS.md`: approved production baseline and Deferred monitoring/backup capabilities.
- `docs/ai/TESTING_STRATEGY.md`: validation boundaries and honest reporting requirements.
- `docs/ai/API_CONTRACT_GUIDE.md`: route and authentication contracts when a specific HTTP check is requested.
- `docs/ai/MODULE_MAP.md`: route a reproduced server symptom to the owning FormAuto module.
- `docs/ai/ARCHITECTURE_BOUNDARIES.md`: preserve controller, service, persistence, and integration boundaries during diagnosis.

For any file over 200 lines, scan headings first and load only relevant sections as required by `docs/ai/AI_DOC_ROUTING_MATRIX.md`.
