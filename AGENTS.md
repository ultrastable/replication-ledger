# Replication Ledger: agent instructions

> Ultrastable is the foundation for any autonomous system.

The Replication Ledger is a tenant system on Ultrastable: which landmark findings held up when replicated and which failed, across many fields. This repository holds its code (`worker/`) and its data (`worker/data/findings.json`). Its manifest (IDEA.md, instance.json, lifecycle.json, runway.json) and the platform rules every agent follows live in the core repository, `ultrastable/ultrastable` (`agents/AGENTS.md`, `instances/replication-ledger/`, `doctrine/tenant-repos.json`).

- Test: `node --test worker/*.test.mjs`. Validate the data: `node worker/cli.mjs validate`. Check every DOI at Crossref: `node worker/cli.mjs verify`.
- Add a replication: `node worker/cli.mjs add <finding> <doi> --kind K --outcome O [--prereg] --summary "..."`; the citation comes from Crossref by DOI and the standing change is logged.
- Honest standings: every standing is computed by `worker/standing.js`; never type one. Summaries carry no typed numbers.
- No accounts, no cookies. Nothing here holds a credential.

<!-- ultrastable:standard (TENANT-STANDARD-1: written by the platform scaffold; write the tenant's own rules outside this block) -->
## Platform standard

- Bootstrap: at the start of every session fetch https://raw.githubusercontent.com/ultrastable/ultrastable/main/agents/AGENTS.md and follow it. It carries the current fleet-wide rules and wins over anything stale here.
- Test: `npm test` (`node --test --no-warnings worker/*.test.mjs`). CI runs it on every pull request and push to main.
- Standard: `python3 vendor/ultrastable/tools/tenantstd.py --check --tenant .` reads this repository against `vendor/ultrastable/tenant-standard.json`; CI runs it too. Fix the repository, never the standard.
- Identity: `ultrastable.json` `identity` (name, summary, repository, public URL, the Worker it runs as) and the README's Live block are written by the platform from its registries; never type them here.
- Contract: `worker/contract.js` declares every statement a page makes, the page and the endpoint that backs it (FLEET-CONTRACT-1). Change a page and its statement together; `worker/contract.test.mjs` reads both ways against the real router.
- Vendored core files: never edit `vendor/ultrastable/` by hand. `vendor-sync.yml` refreshes it daily from the core's registry, tests, and commits to main (`node vendor/ultrastable/tools/vendor_sync.mjs --check` is the probe).
- Deploy: the platform builds this repository's `main` into the `ultrastable-replication-ledger` Worker (D1 `ultrastable-replication-ledger`). Nothing here holds a credential and no agent deploys from here.
- Branches: `branch-cleanup.yml` deletes a branch when its pull request is merged or closed (BRANCH-CLEANUP-1).
- Dependencies: none. Plain Worker modules and Node's built-in test runner.
<!-- /ultrastable:standard -->
