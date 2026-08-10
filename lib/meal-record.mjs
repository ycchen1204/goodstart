export function confirmMealRecord(draft) {
  if (draft.status !== "ai-draft") return draft;

  return { ...draft, status: "confirmed" };
}

export function isCompleteRecordDay(records) {
  return records.filter((record) => record.status === "confirmed").length >= 2;
}
