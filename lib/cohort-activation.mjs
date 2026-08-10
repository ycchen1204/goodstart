/**
 * Pure activation rules for the local pilot. A server-side implementation will
 * replace the in-memory list after the hospital has approved authentication and
 * data storage.
 */
export function activateCohort({ activationCode, cohortId, activations }) {
  const normalizedCode = activationCode.trim().toUpperCase();
  const activation = activations.find((item) => item.code === normalizedCode);

  if (!activation) {
    return { ok: false, reason: "找不到此啟用碼。請確認後再試一次。" };
  }

  if (activation.cohortId !== cohortId) {
    return { ok: false, reason: "此啟用碼不屬於您選擇的班級。" };
  }

  if (activation.usedAt) {
    return { ok: false, reason: "此啟用碼已使用，無法再次加入班級。" };
  }

  return {
    ok: true,
    activation: { ...activation, usedAt: new Date().toISOString() },
  };
}

export function createActivationCode(existingCodes) {
  let code = "";

  do {
    code = `WM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (existingCodes.includes(code));

  return code;
}

export function resumeMemberSession({ lineAccountId, memberships }) {
  const membership = memberships.find(
    (item) => item.lineAccountId === lineAccountId,
  );

  return membership
    ? { ok: true, cohortId: membership.cohortId }
    : { ok: false, reason: "此 LINE 帳號尚未完成班級啟用。" };
}
