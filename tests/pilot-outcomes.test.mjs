import assert from "node:assert/strict";
import test from "node:test";
import { buildMetricTrend, evaluatePilot, validateWeeklyLifestyleReview } from "../lib/pilot-outcomes.mjs";

test("builds a member-only measurement trend from the three planned timepoints", () => {
  assert.deepEqual(buildMetricTrend([
    { point: "baseline", weightKg: 80 }, { point: "week4", weightKg: 78 }, { point: "week8", weightKg: 76.5 },
  ], "weightKg"), [
    { point: "baseline", value: 80 }, { point: "week4", value: 78 }, { point: "week8", value: 76.5 },
  ]);
});

test("requires weekly sleep and exercise review inputs", () => {
  assert.deepEqual(validateWeeklyLifestyleReview({ sleepQuality: 4, exerciseDays: 3, exerciseMinutes: 120 }), { valid: true });
  assert.equal(validateWeeklyLifestyleReview({ sleepQuality: 0, exerciseDays: 3, exerciseMinutes: 120 }).valid, false);
});

test("evaluates the agreed feasibility thresholds", () => {
  assert.deepEqual(evaluatePilot({ activationRate: 0.82, week8ConsistencyRate: 0.72, easeOfUseRate: 0.84, week12ContinuationRate: 0.51 }), {
    activation: true, week8Consistency: true, easeOfUse: true, continuation: true,
  });
});
