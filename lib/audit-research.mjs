export function createAuditEntry(entry) {
  if (!entry.reason?.trim()) throw new Error("管理者修改需要填寫修改原因。");
  return entry;
}

export function researchEligibleRecords(records) {
  return records.filter((record) =>
    record.researchConsent && record.aiConsent && record.status === "confirmed" && !record.deleted,
  );
}
