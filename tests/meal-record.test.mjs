import assert from "node:assert/strict";
import test from "node:test";
import { confirmMealRecord, isCompleteRecordDay } from "../lib/meal-record.mjs";

test("does not count an unconfirmed AI draft as a meal record", () => {
  assert.equal(isCompleteRecordDay([
    { status: "confirmed", mealType: "breakfast" },
    { status: "ai-draft", mealType: "lunch" },
  ]), false);
});

test("counts a day as complete after two confirmed meal records", () => {
  assert.equal(isCompleteRecordDay([
    { status: "confirmed", mealType: "breakfast" },
    { status: "confirmed", mealType: "dinner" },
  ]), true);
});

test("turns an AI draft into a confirmed record only after the member accepts it", () => {
  const result = confirmMealRecord({
    mealType: "lunch",
    source: "ai-photo",
    proteinRange: { min: 18, max: 25 },
    status: "ai-draft",
  });

  assert.deepEqual(result, {
    mealType: "lunch",
    source: "ai-photo",
    proteinRange: { min: 18, max: 25 },
    status: "confirmed",
  });
});
