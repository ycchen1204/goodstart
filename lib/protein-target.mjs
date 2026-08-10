export function calculateProteinTarget(baselineWeightKg) {
  return {
    min: Math.round(baselineWeightKg * 1.2),
    max: Math.round(baselineWeightKg * 1.5),
    unit: "g/day",
  };
}

export function summarizeDailyProtein(records) {
  return records
    .filter((record) => record.status === "confirmed")
    .reduce(
      (total, record) => ({
        min: total.min + record.proteinRange.min,
        max: total.max + record.proteinRange.max,
      }),
      { min: 0, max: 0 },
    );
}
