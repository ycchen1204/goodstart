import assert from "node:assert/strict";
import test from "node:test";
import { activateCohort, resumeMemberSession } from "../lib/cohort-activation.mjs";

const activations = [
  { code: "WM-115A01", cohortId: "cohort-115", usedAt: null },
  { code: "WM-115A02", cohortId: "cohort-115", usedAt: "2026-08-10T08:00:00.000Z" },
  { code: "WM-116B01", cohortId: "cohort-116", usedAt: null },
];

test("allows an unused activation code to join its assigned cohort", () => {
  const result = activateCohort({
    activationCode: "wm-115a01",
    cohortId: "cohort-115",
    activations,
  });

  assert.equal(result.ok, true);
  assert.equal(result.activation.cohortId, "cohort-115");
  assert.ok(result.activation.usedAt);
});

test("does not allow a code to join a different cohort", () => {
  const result = activateCohort({
    activationCode: "WM-116B01",
    cohortId: "cohort-115",
    activations,
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "此啟用碼不屬於您選擇的班級。",
  });
});

test("does not allow an activation code to be used twice", () => {
  const result = activateCohort({
    activationCode: "WM-115A02",
    cohortId: "cohort-115",
    activations,
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "此啟用碼已使用，無法再次加入班級。",
  });
});

test("lets a member who already linked the same LINE account return without an activation code", () => {
  const result = resumeMemberSession({
    lineAccountId: "line-user-01",
    memberships: [{ lineAccountId: "line-user-01", cohortId: "cohort-115" }],
  });

  assert.deepEqual(result, { ok: true, cohortId: "cohort-115" });
});
