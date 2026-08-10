const requiredMetrics = [
  "weightKg",
  "bmi",
  "waistCm",
  "waistHipRatio",
  "skeletalMuscleKg",
  "bodyFatKg",
  "bodyFatPercent",
];

export function validateBodyMeasurement(measurement) {
  const missing = requiredMetrics.filter((metric) => measurement[metric] === undefined || measurement[metric] === null || measurement[metric] === "");
  if (missing.length > 0) return { valid: false, warnings: [`缺少必要欄位：${missing.join("、")}。`] };

  const warnings = [];
  if (measurement.waistHipRatio < 0.4 || measurement.waistHipRatio > 1.5) {
    if (!measurement.overrideReason) return { valid: false, warnings: ["腰臀比超出預設提醒範圍，請確認或填寫覆寫原因。"] };
    warnings.push("腰臀比超出預設提醒範圍，已保留覆寫原因。");
  }

  return { valid: true, warnings };
}

export function visibleBodyMeasurements(records, viewer) {
  return records.filter((record) =>
    record.cohortId === viewer.cohortId &&
    (viewer.role === "manager" || record.memberId === viewer.memberId),
  );
}
