export function buildMetricTrend(measurements, metric) {
  return measurements.map((measurement) => ({ point: measurement.point, value: measurement[metric] }));
}

export function validateWeeklyLifestyleReview(review) {
  const valid = Number.isInteger(review.sleepQuality) && review.sleepQuality >= 1 && review.sleepQuality <= 5 &&
    Number.isInteger(review.exerciseDays) && review.exerciseDays >= 0 && review.exerciseDays <= 7 &&
    Number.isFinite(review.exerciseMinutes) && review.exerciseMinutes >= 0;
  return valid ? { valid: true } : { valid: false, reason: "請完成睡眠品質、運動天數與運動分鐘數。" };
}

export function evaluatePilot(metrics) {
  return {
    activation: metrics.activationRate >= 0.8,
    week8Consistency: metrics.week8ConsistencyRate >= 0.7,
    easeOfUse: metrics.easeOfUseRate >= 0.8,
    continuation: metrics.week12ContinuationRate >= 0.5,
  };
}
