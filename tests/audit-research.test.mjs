import assert from "node:assert/strict";
import test from "node:test";
import { createAuditEntry, researchEligibleRecords } from "../lib/audit-research.mjs";

test("records manager edits with actor, time, before, after and reason", () => {
  const entry = createAuditEntry({
    actorId: "manager-1", action: "update-body-measurement", before: { weightKg: 50 }, after: { weightKg: 49.2 }, reason: "已依原始報告再次確認", at: "2026-09-01T09:15:00+08:00",
  });
  assert.deepEqual(entry, {
    actorId: "manager-1", action: "update-body-measurement", before: { weightKg: 50 }, after: { weightKg: 49.2 }, reason: "已依原始報告再次確認", at: "2026-09-01T09:15:00+08:00",
  });
});

test("rejects manager edits without a reason", () => {
  assert.throws(() => createAuditEntry({ actorId: "manager-1", action: "update-meal", before: {}, after: {}, reason: "", at: "2026-09-01" }), /需要填寫修改原因/);
});

test("research export only includes confirmed records with active research consent", () => {
  const exportRows = researchEligibleRecords([
    { memberId: "a", researchConsent: true, aiConsent: true, status: "confirmed", deleted: false },
    { memberId: "b", researchConsent: false, aiConsent: true, status: "confirmed", deleted: false },
    { memberId: "c", researchConsent: true, aiConsent: true, status: "ai-draft", deleted: false },
    { memberId: "d", researchConsent: true, aiConsent: false, status: "confirmed", deleted: false },
    { memberId: "e", researchConsent: true, aiConsent: true, status: "confirmed", deleted: true },
  ]);
  assert.deepEqual(exportRows, [{ memberId: "a", researchConsent: true, aiConsent: true, status: "confirmed", deleted: false }]);
});
