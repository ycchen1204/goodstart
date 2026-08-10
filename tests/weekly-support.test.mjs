import assert from "node:assert/strict";
import test from "node:test";
import { createWeeklySummary, dailyReminder } from "../lib/weekly-support.mjs";

test("requires a weekly summary to contain affirmation, priority and next action", () => {
  assert.deepEqual(createWeeklySummary({
    affirmation: "本週平日記錄很穩定。",
    priority: "午餐可多安排一份蛋白質來源。",
    nextAction: "下週先完成每日兩餐紀錄。",
  }), { valid: true });
});

test("does not create an incomplete weekly summary", () => {
  assert.deepEqual(createWeeklySummary({ affirmation: "做得很好", priority: "", nextAction: "繼續記錄" }), {
    valid: false,
    reason: "週摘要需要包含肯定、優先調整與下週行動。",
  });
});

test("stops the daily reminder after two meals are confirmed", () => {
  assert.equal(dailyReminder({ confirmedMeals: 2 }), null);
});

test("uses a health-detail-free reminder before daily completion", () => {
  const message = dailyReminder({ confirmedMeals: 1 });
  assert.match(message, /今天再記錄一餐/);
  assert.doesNotMatch(message, /體重|蛋白質|BMI|體脂肪/);
});
