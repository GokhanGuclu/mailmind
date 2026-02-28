# MailMind

Backend platform for multi-provider mailbox management and account-level authentication.

This README is the entrypoint and documentation hub. Implementation details are intentionally delegated to module READMEs.

## Status

- Date snapshot: `2026-02-28`
- Runtime status: `Active development`
- Architecture style: `Modular monolith (NestJS + Prisma + PostgreSQL)`

## Documentation Map

| Document | Purpose |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Project-wide architecture principles and module boundaries |
| [mailmind-api/README.md](./mailmind-api/README.md) | Original Nest starter README kept untouched |
| [mailmind-api/src/modules/iam/README.md](./mailmind-api/src/modules/iam/README.md) | IAM module contracts, lifecycle, data model, tests |
| [mailmind-api/src/modules/mailbox/README.md](./mailmind-api/src/modules/mailbox/README.md) | Mailbox module API, sync pipeline, roadmap, operational notes |

## Current Capability Snapshot (as of 2026-02-28)

| Area | Maturity | Implemented Surface | Verified By |
| --- | --- | --- | --- |
| IAM | Implemented | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | `mailmind-api/test/iam.e2e-spec.ts` |
| Mailbox | MVP+ | `GET /mailbox/health`, `POST /mailbox/accounts`, `GET /mailbox/accounts`, `POST /mailbox/accounts/:id/activate`, `POST /mailbox/accounts/:id/revoke`, worker-driven sync and message persistence | `mailmind-api/test/mailbox.e2e-spec.ts` |
| Platform | Implemented | `GET /health`, Prisma migrations, dockerized Postgres | App boot + migration flow |

## Roadmap Overview

Mailbox delivery is tracked as a stepwise production-hardening roadmap.

- Immediate focus: stabilize current e2e assertions and remove test/debug friction.
- Next core deliveries: message listing API, delta sync, worker robustness, credential encryption.
- Full checklist and acceptance criteria: [Mailbox Module Roadmap](./mailmind-api/src/modules/mailbox/README.md#mailbox-roadmap-prod-ready-path).

## Quick Start (Minimal)

```bash
git clone <repo-url>
cd MailMind/mailmind-api
npm install
docker compose up -d
npx prisma migrate dev
npm run start:dev
```

Default local API address: `http://localhost:4000`

## Environment Variables (Minimal)

Create `.env` in `mailmind-api/`:

```dotenv
PORT=4000
DATABASE_URL="postgresql://mailmind:mailmind_dev@localhost:5432/mailmind?schema=public"
JWT_ACCESS_SECRET="replace-with-long-random-secret"
JWT_REFRESH_SECRET="replace-with-another-long-random-secret"
WORKERS_ENABLED=true
OUTBOX_WORKER_INTERVAL_MS=1000
MAILBOX_SYNC_WORKER_INTERVAL_MS=1000
```

For module-level variable semantics and runtime behavior, use:

- [IAM README](./mailmind-api/src/modules/iam/README.md)
- [Mailbox README](./mailmind-api/src/modules/mailbox/README.md)

## License

This repository is licensed under [LICENSE](./LICENSE).
