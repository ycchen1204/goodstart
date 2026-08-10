export function createWeeklySummary({ affirmation, priority, nextAction }) {
  if (!affirmation.trim() || !priority.trim() || !nextAction.trim()) {
    return { valid: false, reason: "週摘要需要包含肯定、優先調整與下週行動。" };
  }
  return { valid: true };
}

export function dailyReminder({ confirmedMeals }) {
  if (confirmedMeals >= 2) return null;
  return "提醒您：今天再記錄一餐，即可完成今日飲食紀錄。";
}
