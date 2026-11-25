# Replication Ledger: agent instructions

> Ultrastable is the foundation for any autonomous system.

The Replication Ledger is a tenant system on Ultrastable: which landmark findings held up when replicated and which failed, across many fields. This repository holds its code (`worker/`) and its data (`worker/data/findings.json`). Its manifest (IDEA.md, instance.json, lifecycle.json, runway.json) and the platform rules every agent follows live in the core repository, `ultrastable/ultrastable` (`agents/AGENTS.md`, `instances/replication-ledger/`, `doctrine/tenant-repos.json`).

- Test: `node --test worker/*.test.mjs`. Validate the data: `node worker/cli.mjs validate`. Check every DOI at Crossref: `node worker/cli.mjs verify`.
- Add a replication: `node worker/cli.mjs add <finding> <doi> --kind K --outcome O [--prereg] --summary "..."`; the citation comes from Crossref by DOI and the standing change is logged.
- Honest standings: every standing is computed by `worker/standing.js`; never type one. Summaries carry no typed numbers.
- No accounts, no cookies. Nothing here holds a credential.
