"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  activateCohort,
  createActivationCode,
} from "../lib/cohort-activation.mjs";
import { evaluateConsent } from "../lib/consent.mjs";
import { confirmMealRecord, isCompleteRecordDay } from "../lib/meal-record.mjs";
import { calculateProteinTarget, summarizeDailyProtein } from "../lib/protein-target.mjs";
import { buildLeaderboard, visibleFoodWallPosts } from "../lib/food-wall.mjs";
import { validateBodyMeasurement } from "../lib/body-composition.mjs";
import { createWeeklySummary } from "../lib/weekly-support.mjs";
import { buildMetricTrend, validateWeeklyLifestyleReview } from "../lib/pilot-outcomes.mjs";

type Activation = {
  code: string;
  cohortId: string;
  usedAt: string | null;
  memberName?: string;
};

type Cohort = { id: string; name: string; period: string; members: number };
type MealRecord = { id: string; mealType: string; source: string; status: string; proteinRange: { min: number; max: number } };
type FoodWallPost = { id: string; mealType: string; proteinRange: { min: number; max: number } };
type LeaderboardMember = { rank: number; member: string; points: number };
type TrendPoint = { point: string; value: number };

const initialCohorts: Cohort[] = [
  { id: "cohort-115", name: "115 年員工體重管理班", period: "2026/09–2026/10", members: 18 },
  { id: "cohort-116", name: "116 年員工體重管理班", period: "尚未開課", members: 0 },
];

const initialActivations: Activation[] = [
  { code: "WM-115A01", cohortId: "cohort-115", usedAt: null },
  { code: "WM-115A02", cohortId: "cohort-115", usedAt: "2026-08-10T08:00:00.000Z", memberName: "王小安" },
  { code: "WM-116B01", cohortId: "cohort-116", usedAt: null },
];

const demoFoodPosts = [
  { id: "food-1", cohortId: "cohort-115", visibility: "cohort", mealType: "午餐", proteinRange: { min: 18, max: 25 } },
  { id: "food-2", cohortId: "cohort-115", visibility: "cohort", mealType: "晚餐", proteinRange: { min: 20, max: 28 } },
  { id: "food-private", cohortId: "cohort-115", visibility: "private", mealType: "早餐", proteinRange: { min: 12, max: 18 } },
  { id: "food-other", cohortId: "cohort-116", visibility: "cohort", mealType: "早餐", proteinRange: { min: 12, max: 18 } },
];

export default function Home() {
  const [screen, setScreen] = useState<"member" | "manager">("member");
  const [lineSignedIn, setLineSignedIn] = useState(false);
  const [signedInName, setSignedInName] = useState<string | null>(null);
  const [selectedCohort, setSelectedCohort] = useState("cohort-115");
  const [activationCode, setActivationCode] = useState("");
  const [message, setMessage] = useState("");
  const [joinedCohort, setJoinedCohort] = useState<string | null>(null);
  const [aiConsent, setAiConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [consentComplete, setConsentComplete] = useState(false);
  const [mealType, setMealType] = useState("午餐");
  const [foodGroup, setFoodGroup] = useState("豆魚蛋肉類");
  const [mealDraft, setMealDraft] = useState<MealRecord | null>(null);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([
    { id: "demo-breakfast", mealType: "早餐", source: "圖示選單", status: "confirmed", proteinRange: { min: 12, max: 18 } },
  ]);
  const baselineWeightKg = 50;
  const proteinTarget = calculateProteinTarget(baselineWeightKg);
  const dailyProtein = summarizeDailyProtein(mealRecords);
  const foodWallPosts: FoodWallPost[] = visibleFoodWallPosts(demoFoodPosts, "cohort-115");
  const leaderboard: LeaderboardMember[] = buildLeaderboard([
    { member: "林小雨", optedIn: true, completeDays: 5 },
    { member: "陳大明", optedIn: true, completeDays: 4 },
    { member: "王小安", optedIn: true, completeDays: 4 },
  ]);
  const [activations, setActivations] = useState<Activation[]>(initialActivations);
  const [cohorts, setCohorts] = useState<Cohort[]>(initialCohorts);
  const [newCohortName, setNewCohortName] = useState("116 年員工體重管理班");
  const [newCodeCohort, setNewCodeCohort] = useState("cohort-115");
  const [bodyMeasurementMessage, setBodyMeasurementMessage] = useState("");
  const [weeklySummaryMessage, setWeeklySummaryMessage] = useState("");
  const [lifestyleMessage, setLifestyleMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.ok ? response.json() : { authenticated: false })
      .then((session) => {
        if (session.authenticated) {
          setLineSignedIn(true);
          setSignedInName(session.user.display_name);
        }
      })
      .catch(() => undefined);
  }, []);

  function joinCohort(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = activateCohort({ activationCode, cohortId: selectedCohort, activations });

    if (!result.ok) {
      setMessage(result.reason ?? "無法完成啟用，請確認輸入資料後再試一次。");
      return;
    }

    setActivations((current) =>
      current.map((item) =>
        item.code === result.activation.code
          ? { ...result.activation, memberName: "示範學員" }
          : item,
      ),
    );
    setJoinedCohort(result.activation.cohortId);
    setMessage("");
  }

  function addCohort(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newCohortName.trim();
    if (!name) return;
    const id = `cohort-${Date.now()}`;
    setCohorts((current) => [
      ...current,
      { id, name, period: "尚未開課", members: 0 },
    ]);
    setNewCodeCohort(id);
    setNewCohortName("");
  }

  function confirmConsent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = evaluateConsent({ aiConsent, researchConsent });
    if (result.platformAccess === "blocked") {
      setMessage(result.reason ?? "目前無法完成同意確認，請稍後再試一次。");
      return;
    }
    setMessage("");
    setConsentComplete(true);
  }

  function addActivationCode() {
    const code = createActivationCode(activations.map((item) => item.code));
    setActivations((current) => [
      ...current,
      { code, cohortId: newCodeCohort, usedAt: null },
    ]);
  }

  function createAiDraft() {
    setMealDraft({
      id: `draft-${Date.now()}`,
      mealType,
      source: "AI 飲食照片示範",
      status: "ai-draft",
      proteinRange: { min: 18, max: 25 },
    });
  }

  function addManualMeal() {
    setMealRecords((current) => [
      ...current,
      { id: `manual-${Date.now()}`, mealType, source: `${foodGroup}圖示選單`, status: "confirmed", proteinRange: { min: 12, max: 20 } },
    ]);
  }

  function confirmDraft() {
    if (!mealDraft) return;
    setMealRecords((current) => [...current, confirmMealRecord(mealDraft)]);
    setMealDraft(null);
  }

  function saveBodyMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const result = validateBodyMeasurement({
      memberId: "demo-member",
      cohortId: "cohort-115",
      measuredAt: String(fields.get("measuredAt")),
      instrument: "ACCUNIQ BC380",
      weightKg: Number(fields.get("weightKg")), bmi: Number(fields.get("bmi")), waistCm: Number(fields.get("waistCm")),
      waistHipRatio: Number(fields.get("waistHipRatio")), skeletalMuscleKg: Number(fields.get("skeletalMuscleKg")),
      bodyFatKg: Number(fields.get("bodyFatKg")), bodyFatPercent: Number(fields.get("bodyFatPercent")),
      overrideReason: String(fields.get("overrideReason") || ""),
    });
    setBodyMeasurementMessage(result.valid ? "已儲存示範量測；正式版將保留輸入者、時間與修改原因。" : (result.warnings[0] ?? "請確認量測資料是否完整。"));
  }

  function saveWeeklySummary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const result = createWeeklySummary({
      affirmation: String(fields.get("affirmation") || ""),
      priority: String(fields.get("priority") || ""),
      nextAction: String(fields.get("nextAction") || ""),
    });
    setWeeklySummaryMessage(result.valid ? "已儲存示範週摘要；正式版將只提供給該學員。" : (result.reason ?? "請完整填寫週摘要。"));
  }

  function saveLifestyleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const result = validateWeeklyLifestyleReview({ sleepQuality: Number(fields.get("sleepQuality")), exerciseDays: Number(fields.get("exerciseDays")), exerciseMinutes: Number(fields.get("exerciseMinutes")) });
    setLifestyleMessage(result.valid ? "已儲存本週回顧。" : (result.reason ?? "請確認本週回顧資料。"));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="員工體重管理平台">
          <span className="brand-mark">＋</span>
          <span>GoodStart</span>
          <small>本機示範版</small>
        </div>
        <button
          className="text-button"
          onClick={() => setScreen(screen === "member" ? "manager" : "member")}
          type="button"
        >
          {screen === "member" ? "切換管理者示範" : "切換學員示範"}
        </button>
      </header>

      {screen === "member" ? (
        <section className="content-grid" aria-label="學員啟用流程">
          <div className="intro-panel">
            <p className="eyebrow">第一步</p>
            <h1>加入您的<br />體重管理班</h1>
            <p className="intro-copy">
              第一次以 LINE 驗證身分後，輸入管理者提供的一次性啟用碼，即可加入正確班級。
            </p>
            <div className="privacy-note">
              <span aria-hidden="true">🔒</span>
              <p><strong>班級資料彼此隔離</strong><br />不同屆學員無法互相查看紀錄。</p>
            </div>
          </div>

          <div className="card activation-card">
            {!lineSignedIn ? (
              <>
                <p className="step-label">1／2 身分驗證</p>
                <h2>使用 LINE 登入</h2>
                <p>啟用碼只在第一次綁定班級時使用；日後換手機或被登出，以同一個 LINE 帳號重新登入即可。</p>
                <button className="line-button" type="button" onClick={() => { window.location.href = "/api/auth/line"; }}>
                  <span>LINE</span> 以 LINE 登入
                </button>
              </>
            ) : joinedCohort && !consentComplete ? (
              <form onSubmit={confirmConsent}>
                <p className="step-label">啟用前確認</p>
                <h2>平台與研究同意</h2>
                <p className="consent-intro">兩份同意分開處理。您可以選擇不參加研究；但必須同意飲食照片交由院外 AI 分析，才能使用本平台。</p>
                <label className="check-row" htmlFor="ai-consent">
                  <input id="ai-consent" type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} />
                  <span><strong>我同意院外 AI 分析我的飲食照片</strong><br />只上傳飲食照片作食物與蛋白質初步估計；不會上傳姓名、病歷號或身體組成報告。</span>
                </label>
                <label className="check-row" htmlFor="research-consent">
                  <input id="research-consent" type="checkbox" checked={researchConsent} onChange={(event) => setResearchConsent(event.target.checked)} />
                  <span><strong>我同意未來使用去識別化資料進行研究分析</strong><br />此項為選擇性；不勾選仍可使用平台。可依院內規範撤回未來研究分析同意。</span>
                </label>
                {message ? <p className="form-message" role="alert">{message}</p> : null}
                <button className="primary-button" type="submit">確認並啟用平台</button>
              </form>
            ) : joinedCohort ? (
              <div className="today-state">
                <p className="step-label">今日飲食紀錄</p>
                <h2>先完成今天的<br />兩餐記錄</h2>
                <div className="protein-summary">
                  <div><span>今日已記錄蛋白質</span><strong>{dailyProtein.min}–{dailyProtein.max} <small>g</small></strong></div>
                  <div><span>個人每日目標</span><strong>{proteinTarget.min}–{proteinTarget.max} <small>g</small></strong></div>
                  <p>依課前基線體重 {baselineWeightKg} kg × 1.2–1.5 g/kg/day 估算；此為記錄與自我觀察用的區間。</p>
                </div>
                <div className="completion-bar"><span style={{ width: `${Math.min(mealRecords.filter((item) => item.status === "confirmed").length, 2) * 50}%` }} /></div>
                <p className="completion-copy">已完成 {mealRecords.filter((item) => item.status === "confirmed").length}／2 餐{isCompleteRecordDay(mealRecords) ? "，今天的完整記錄已達成。" : "，再記錄一餐即可完成今天。"}</p>
                <div className="meal-list">
                  {mealRecords.map((record) => <div className="meal-item" key={record.id}><span>{record.mealType}</span><small>{record.source}・蛋白質約 {record.proteinRange.min}–{record.proteinRange.max} g</small></div>)}
                </div>
                <label htmlFor="meal-type">餐別</label>
                <select id="meal-type" value={mealType} onChange={(event) => setMealType(event.target.value)}>
                  <option>早餐</option><option>午餐</option><option>晚餐</option><option>點心</option>
                </select>
                <label htmlFor="food-group">簡易食物選單</label>
                <select id="food-group" value={foodGroup} onChange={(event) => setFoodGroup(event.target.value)}>
                  <option>豆魚蛋肉類</option><option>乳品類</option><option>全穀雜糧類</option><option>蔬菜水果類</option>
                </select>
                <button className="primary-button" type="button" onClick={addManualMeal}>以圖示選單記錄</button>
                <button className="secondary-button ai-button" type="button" onClick={createAiDraft}>建立 AI 飲食照片分析草稿</button>
                {mealDraft ? <div className="draft-box"><strong>AI 分析草稿</strong><p>{mealDraft.mealType}：蛋白質約 {mealDraft.proteinRange.min}–{mealDraft.proteinRange.max} g。請確認或未來修正後再存入。</p><button type="button" className="primary-button" onClick={confirmDraft}>確認並存入正式紀錄</button></div> : null}
                <p className="hint">此頁是本機示範：尚未上傳影像，也未連接院外 AI。</p>
                <section className="community-section" aria-label="同屆飲食牆與排行榜">
                  <div className="community-heading"><div><p className="step-label">同屆飲食牆</p><h3>互相參考，彼此鼓勵</h3></div><span>僅 115 屆可見</span></div>
                  <p className="community-copy">只顯示公開餐點與單餐蛋白質區間；健康數值、目標和每日總量不會公開。</p>
                  <div className="wall-grid">
                    {foodWallPosts.map((post, index) => <article className="food-post" key={post.id}><div className={`food-image tone-${index + 1}`} aria-hidden="true">🥗</div><strong>{post.mealType}</strong><span>蛋白質約 {post.proteinRange.min}–{post.proteinRange.max} g</span><button type="button">👏 鼓勵</button></article>)}
                  </div>
                  <div className="leaderboard"><div><p className="step-label">本週完整記錄日</p><h3>自願排行榜</h3></div><ol>{leaderboard.map((member) => <li key={member.member}><span>{member.rank}. {member.member}</span><strong>{member.points} 天</strong></li>)}</ol><p>每個完整記錄日 1 點，每週最多 7 點；同分並列。不以體重或體脂肪排名。</p></div>
                </section>
                <section className="private-section"><p className="step-label">僅自己與管理者可見</p><h3>身體組成趨勢</h3><div className="trend-row">{(buildMetricTrend([{ point: "課前", weightKg: 80 }, { point: "第 4 週", weightKg: 78 }, { point: "第 8 週", weightKg: 76.5 }], "weightKg") as TrendPoint[]).map((item) => <div key={item.point}><strong>{item.value} kg</strong><span>{item.point}</span></div>)}</div><form onSubmit={saveLifestyleReview}><h3>本週睡眠與運動回顧</h3><div className="lifestyle-grid"><label>睡眠品質（1–5）<input name="sleepQuality" type="number" min="1" max="5" defaultValue="4" required /></label><label>運動天數<input name="exerciseDays" type="number" min="0" max="7" defaultValue="3" required /></label><label>運動分鐘數<input name="exerciseMinutes" type="number" min="0" defaultValue="120" required /></label></div>{lifestyleMessage ? <p className="form-message" role="status">{lifestyleMessage}</p> : null}<button className="secondary-button" type="submit">儲存本週回顧</button></form></section>
              </div>
            ) : (
              <form onSubmit={joinCohort}>
                <p className="step-label">2／2 加入班級{signedInName ? `・${signedInName}` : ""}</p>
                <h2>首次輸入啟用碼</h2>
                <label htmlFor="cohort">選擇班級</label>
                <select id="cohort" value={selectedCohort} onChange={(event) => setSelectedCohort(event.target.value)}>
                  {cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}
                </select>
                <label htmlFor="activation-code">啟用碼</label>
                <input
                  id="activation-code"
                  value={activationCode}
                  onChange={(event) => setActivationCode(event.target.value)}
                  placeholder="例如：WM-115A01"
                  autoCapitalize="characters"
                  required
                />
                {message ? <p className="form-message" role="alert">{message}</p> : null}
                <button className="primary-button" type="submit">啟用並加入班級</button>
                <p className="hint">啟用碼僅供首次綁定班級，可用示範碼：WM-115A01</p>
              </form>
            )}
          </div>
        </section>
      ) : (
        <section className="manager-view" aria-label="管理者班級設定">
          <div className="manager-heading">
            <p className="eyebrow">管理者示範</p>
            <h1>班級與啟用碼管理</h1>
            <p>正式版將限定管理者在所屬班級內查看與編輯資料；此處只展示流程。</p>
          </div>
          <div className="manager-grid">
            <form className="card compact-card" onSubmit={addCohort}>
              <p className="step-label">建立班級</p>
              <label htmlFor="cohort-name">班級名稱</label>
              <input id="cohort-name" value={newCohortName} onChange={(event) => setNewCohortName(event.target.value)} placeholder="例如：116 年員工體重管理班" />
              <button className="primary-button" type="submit">建立班級</button>
            </form>
            <section className="card compact-card">
              <p className="step-label">發送一次性啟用碼</p>
              <label htmlFor="code-cohort">指定班級</label>
              <select id="code-cohort" value={newCodeCohort} onChange={(event) => setNewCodeCohort(event.target.value)}>
                {cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}
              </select>
              <button className="primary-button" type="button" onClick={addActivationCode}>建立啟用碼</button>
            </section>
          </div>
          <section className="card table-card">
            <div className="table-heading"><h2>目前班級與啟用碼</h2><span>示範資料</span></div>
            <div className="code-list">
              {activations.map((item) => {
                const cohort = cohorts.find((value) => value.id === item.cohortId);
                return <div className="code-row" key={item.code}>
                  <div><strong>{item.code}</strong><span>{cohort?.name ?? "已建立班級"}</span></div>
                  <span className={item.usedAt ? "status used" : "status available"}>{item.usedAt ? "已使用" : "可使用"}</span>
                </div>;
              })}
            </div>
          </section>
          <form className="card measurement-card" onSubmit={saveBodyMeasurement}>
            <div className="table-heading"><div><p className="step-label">私密身體組成量測</p><h2>手動輸入 ACCUNIQ BC380</h2></div><span>僅本人與管理者可見</span></div>
            <div className="measurement-body">
              <label>量測日期與時間<input name="measuredAt" type="datetime-local" defaultValue="2026-09-01T09:00" required /></label>
              <div className="metrics-grid">
                <label>體重（kg）<input name="weightKg" type="number" step="0.1" defaultValue="50" required /></label>
                <label>BMI（kg/m²）<input name="bmi" type="number" step="0.1" defaultValue="20.1" required /></label>
                <label>腰圍（cm）<input name="waistCm" type="number" step="0.1" defaultValue="72" required /></label>
                <label>腰臀比<input name="waistHipRatio" type="number" step="0.01" defaultValue="0.8" required /></label>
                <label>骨骼肌量（kg）<input name="skeletalMuscleKg" type="number" step="0.1" defaultValue="21" required /></label>
                <label>體脂肪量（kg）<input name="bodyFatKg" type="number" step="0.1" defaultValue="13" required /></label>
                <label>體脂肪百分比（%）<input name="bodyFatPercent" type="number" step="0.1" defaultValue="26" required /></label>
              </div>
              <label>若出現提醒，覆寫原因<input name="overrideReason" placeholder="例如：已依原始儀器報告再次確認" /></label>
              {bodyMeasurementMessage ? <p className="form-message" role="status">{bodyMeasurementMessage}</p> : null}
              <button className="primary-button" type="submit">儲存量測資料</button>
            </div>
          </form>
          <form className="card weekly-card" onSubmit={saveWeeklySummary}>
            <div className="table-heading"><div><p className="step-label">營養師每週摘要</p><h2>給個別學員的三段回饋</h2></div><span>不在同儕飲食牆公開</span></div>
            <div className="measurement-body">
              <label>本週做得好的地方<textarea name="affirmation" placeholder="例如：平日兩餐紀錄很穩定。" required /></label>
              <label>下一步最優先調整<textarea name="priority" placeholder="例如：午餐可多安排一份蛋白質來源。" required /></label>
              <label>下週的一個具體行動<textarea name="nextAction" placeholder="例如：每天先完成兩餐紀錄。" required /></label>
              {weeklySummaryMessage ? <p className="form-message" role="status">{weeklySummaryMessage}</p> : null}
              <button className="primary-button" type="submit">儲存週摘要</button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}
