export function evaluateConsent({ aiConsent, researchConsent }) {
  if (!aiConsent) {
    return {
      platformAccess: "blocked",
      includedInFutureResearch: false,
      reason: "需同意飲食照片送交院外 AI 分析，才能啟用平台。",
    };
  }

  return {
    platformAccess: "active",
    includedInFutureResearch: researchConsent,
  };
}

export function withdrawAiConsent() {
  return {
    platformAccess: "stopped",
    includedInFutureCalculations: false,
    includedInFutureResearch: false,
  };
}

export function withdrawResearchConsent() {
  return {
    platformAccess: "active",
    includedInFutureResearch: false,
  };
}
