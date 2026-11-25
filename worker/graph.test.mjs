// SPDX-License-Identifier: LicenseRef-Ultrastable-USL-1.0
// Copyright (c) Ultrastable
import { test } from "node:test";
import assert from "node:assert/strict";
import seed from "./data/findings.json" with { type: "json" };
import { authorsOf, tables, report, node, step } from "./graph.js";
import { route } from "./index.js";

test("author lists split into names, dropping et al.", () => {
  assert.deepEqual(authorsOf("Hagger MS, Chatzisarantis NLD, Alberts H, et al."), ["Hagger MS", "Chatzisarantis NLD", "Alberts H"]);
  assert.deepEqual(authorsOf(""), []);
});

test("every finding, paper and test becomes a node, and every finding links to its field and papers", () => {
  const r = report(seed);
  assert.equal(r.analysis.by_kind.finding.nodes, seed.findings.length);
  assert.equal(r.analysis.by_kind.finding.orphans, 0);
  const tests = seed.findings.reduce((n, f) => n + (f.replications || []).length, 0);
  assert.equal(r.analysis.by_kind.test.nodes, tests);
  const n = node(seed, `finding:${seed.findings[0].id}`);
  assert.ok(n.nodes.some(x => x.kind === "field") && n.nodes.some(x => x.kind === "paper"));
  assert.ok(tables(seed).every(t => t.rows.length > 0));
});

test("a lead is proposed, kept once the data links the pair, and never proposed twice", () => {
  const first = step(seed, [], "2026-11-25T00:00:00Z");
  assert.ok(first.fresh.length > 0 && first.fresh.length <= 10);
  const again = step(seed, first.fresh, "2026-11-25T01:00:00Z");
  assert.ok(!again.fresh.some(l => first.fresh.some(f => f.src === l.src && f.dst === l.dst)));
  const stale = step(seed, first.fresh, "2026-12-20T00:00:00Z");
  assert.ok(stale.settled.length === first.fresh.length && stale.settled.every(l => l.outcome === "dropped"));
});

test("the graph is served as JSON and as a page", async () => {
  const g = await route("https://x/api/graph").json();
  assert.ok(g.nodes > 0 && g.edges > 0 && Array.isArray(g.hubs));
  assert.equal(route("https://x/api/graph/node?id=finding:nope").status, 404);
  assert.match(await route("https://x/graph").text(), /Connections/);
  const s = await route("https://x/api/graph/search?q=psych").json();
  assert.ok(s.count > 0 && s.nodes.some(n => n.kind === "field"));
  assert.equal(route("https://x/api/graph/search?q=a").status, 400);
});
