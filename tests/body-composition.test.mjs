import assert from "node:assert/strict";
import test from "node:test";
import { validateBodyMeasurement, visibleBodyMeasurements } from "../lib/body-composition.mjs";

const measurement = {
  memberId: "member-1", cohortId: "cohort-115", measuredAt: "2026-09-01T09:00:00+08:00", instrument: "ACCUNIQ BC380",
  weightKg: 50, bmi: 20.1, waistCm: 72, waistHipRatio: 0.8, skeletalMuscleKg: 21, bodyFatKg: 13, bodyFatPercent: 26,
};

test("accepts a complete manual measurement with all seven required metrics", () => {
  assert.deepEqual(validateBodyMeasurement(measurement), { valid: true, warnings: [] });
});

test("warns about implausible values but permits a manager override with a reason", () => {
  const result = validateBodyMeasurement({ ...measurement, waistHipRatio: 2, overrideReason: "已依原始儀器報告再次確認" });
  assert.deepEqual(result, { valid: true, warnings: ["腰臀比超出預設提醒範圍，已保留覆寫原因。"] });
});

test("limits personal body measurement visibility to the member and cohort managers", () => {
  const records = [measurement, { ...measurement, memberId: "member-2" }];
  assert.deepEqual(visibleBodyMeasurements(records, { role: "member", memberId: "member-1", cohortId: "cohort-115" }), [measurement]);
  assert.equal(visibleBodyMeasurements(records, { role: "member", memberId: "member-2", cohortId: "cohort-115" }).length, 1);
  assert.equal(visibleBodyMeasurements(records, { role: "manager", cohortId: "cohort-115" }).length, 2);
});
