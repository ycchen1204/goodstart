import assert from "node:assert/strict";
import test from "node:test";
import { evaluateConsent, withdrawAiConsent, withdrawResearchConsent } from "../lib/consent.mjs";

test("requires external AI consent before a member can use the platform", () => {
  assert.deepEqual(evaluateConsent({ aiConsent: false, researchConsent: false }), {
    platformAccess: "blocked",
    includedInFutureResearch: false,
    reason: "需同意飲食照片送交院外 AI 分析，才能啟用平台。",
  });
});

test("keeps research consent separate from required platform consent", () => {
  assert.deepEqual(evaluateConsent({ aiConsent: true, researchConsent: false }), {
    platformAccess: "active",
    includedInFutureResearch: false,
  });
});

test("withdraws future platform use and calculations when AI consent is withdrawn", () => {
  assert.deepEqual(withdrawAiConsent(), {
    platformAccess: "stopped",
    includedInFutureCalculations: false,
    includedInFutureResearch: false,
  });
});

test("withdraws only future research analysis when research consent is withdrawn", () => {
  assert.deepEqual(withdrawResearchConsent(), {
    platformAccess: "active",
    includedInFutureResearch: false,
  });
});
