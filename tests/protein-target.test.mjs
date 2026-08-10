import assert from "node:assert/strict";
import test from "node:test";
import { calculateProteinTarget, summarizeDailyProtein } from "../lib/protein-target.mjs";

test("calculates the agreed daily protein target from baseline weight", () => {
  assert.deepEqual(calculateProteinTarget(50), { min: 60, max: 75, unit: "g/day" });
});

test("keeps the target as an estimate range rather than a single precise value", () => {
  assert.deepEqual(calculateProteinTarget(63.4), { min: 76, max: 95, unit: "g/day" });
});

test("adds confirmed meal protein estimates but excludes AI drafts", () => {
  const summary = summarizeDailyProtein([
    { status: "confirmed", proteinRange: { min: 12, max: 18 } },
    { status: "ai-draft", proteinRange: { min: 18, max: 25 } },
    { status: "confirmed", proteinRange: { min: 20, max: 28 } },
  ]);

  assert.deepEqual(summary, { min: 32, max: 46 });
});
