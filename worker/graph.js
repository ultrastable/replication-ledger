// SPDX-License-Identifier: LicenseRef-Ultrastable-USL-1.0
// Copyright (c) Ultrastable
// The ledger's knowledge graph (DATAGRAPH-1). Every field, finding, paper, author and replication test is a node; a test links its finding
// and its paper, a paper links its authors, a finding links its field and its original paper. The core module (workers/core/datagraph)
// finds hubs, communities, bridges and orphans, and proposes link leads (Adamic-Adar). The hourly beat keeps the leads in D1 (kg_leads):
// a lead is kept when the data later links the pair, dropped after 14 days, and the outcomes re-weight the insight kinds.
import { extract, analyze, predict, insights, settle, calibrate, neighborhood } from "../vendor/ultrastable/datagraph.js";
import { FIELDS, doiKey } from "./ledger.js";

export const MAX_NEW_LEADS = 10;

// "Baumeister RF, Bratslavsky E, et al." -> ["Baumeister RF", "Bratslavsky E"]
export const authorsOf = s => String(s || "").split(/[,;&]|\band\b/).map(a => a.trim().replace(/\.$/, "")).filter(a => a.length > 1 && !/^et al/i.test(a));
const akey = a => "a:" + a.toLowerCase().replace(/\s+/g, " ");

export function tables(ledger) {
  const papers = new Map(), authors = new Map(), authorship = new Map(), tests = [], findings = [];
  const paper = c => {
    const doi = doiKey(c?.doi); if (!doi) return null;
    if (!papers.has(doi)) papers.set(doi, { id: doi, title: c.title || doi, year: c.year ?? null, venue: c.venue || null });
    for (const a of authorsOf(c.authors)) {
      const k = akey(a);
      if (!authors.has(k)) authors.set(k, { id: k, name: a });
      authorship.set(`${doi}~${k}`, { id: `${doi}~${k}`, paper: doi, author: k });
    }
    return doi;
  };
  for (const f of ledger.findings) {
    findings.push({ id: f.id, name: f.name, field: f.field, topic: f.topic || null, original: paper(f.original) });
    for (const r of f.replications || []) {
      const doi = paper(r.cite); if (!doi) continue;
      tests.push({ id: `${f.id}~${doi}`, finding: f.id, paper: doi, outcome: r.outcome, kind: r.kind, machine: r.machine ? 1 : 0 });
    }
  }
  for (const p of ledger.projects || []) paper(p.cite);
  const fields = Object.entries(FIELDS).map(([id, v]) => ({ id, name: v.name }));
  return [
    { name: "field", rows: fields },
    { name: "finding", rows: findings, refs: { field: "field", original: "paper" } },
    { name: "paper", rows: [...papers.values()], label: "title" },
    { name: "author", rows: [...authors.values()] },
    { name: "test", rows: tests, label: "outcome", refs: { finding: "finding", paper: "paper" } },
    { name: "authorship", rows: [...authorship.values()], refs: { paper: "paper", author: "author" } },
  ];
}

const LIMITS = { maxRowsPerTable: 5000 };
export const build = ledger => extract(tables(ledger), LIMITS);

// What the pages and the API serve: counts, hubs, communities, bridges, insights weighted by the settled lead outcomes.
export function report(ledger, leads = []) {
  const g = build(ledger), a = analyze(g, LIMITS);
  const { weights, tally } = calibrate(leads.filter(l => l.outcome === "kept" || l.outcome === "dropped").map(l => ({ kind: "link", outcome: l.outcome })));
  const open = leads.filter(l => l.outcome === "open");
  const ins = insights({ analysis: a, candidates: open.map(l => ({ src: l.src, dst: l.dst, score: l.score, why: l.why })), weights });
  const { _community, _pagerank, ...analysis } = a;
  return { graph: g, analysis, insights: ins, leads: { open: open.length, kept: tally.link?.kept || 0, dropped: tally.link?.dropped || 0, weights } };
}

export const node = (ledger, id) => neighborhood(build(ledger), id);
export const search = (ledger, q, limit = 25) => build(ledger).nodes.filter(n => String(n.label || "").toLowerCase().includes(q) || n.id.toLowerCase().includes(q)).slice(0, limit).map(({ id, kind, label }) => ({ id, kind, label }));

// The beat's step: settle the open leads against the data as it is now, and propose new ones. Returns the rows to write.
export function step(ledger, leads, now = new Date().toISOString()) {
  const g = build(ledger);
  const settled = settle(leads.filter(l => l.outcome === "open"), g, { now: Date.parse(now) }).filter(l => l.outcome !== "open");
  const fresh = predict(g, { known: leads }).slice(0, MAX_NEW_LEADS).map(c => ({ src: c.src, dst: c.dst, score: c.score, why: c.why, first_seen: now, outcome: "open" }));
  return { settled, fresh };
}
