import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const createdAt = text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`);

export const cohorts = sqliteTable("cohorts", {
  id: text("id").primaryKey(), name: text("name").notNull(), startsAt: text("starts_at"), endsAt: text("ends_at"), status: text("status").notNull().default("draft"), createdAt,
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), lineSubject: text("line_subject").notNull(), displayName: text("display_name").notNull(), department: text("department"), role: text("role").notNull().default("member"), createdAt,
}, (table) => [uniqueIndex("uq_users_line_subject").on(table.lineSubject)]);

export const memberships = sqliteTable("memberships", {
  id: text("id").primaryKey(), cohortId: text("cohort_id").notNull().references(() => cohorts.id), userId: text("user_id").notNull().references(() => users.id), leaderboardOptIn: integer("leaderboard_opt_in", { mode: "boolean" }).notNull().default(false), createdAt,
}, (table) => [uniqueIndex("uq_memberships_cohort_user").on(table.cohortId, table.userId), index("idx_memberships_cohort").on(table.cohortId)]);

export const activationCodes = sqliteTable("activation_codes", {
  id: text("id").primaryKey(), cohortId: text("cohort_id").notNull().references(() => cohorts.id), codeHash: text("code_hash").notNull(), usedByUserId: text("used_by_user_id").references(() => users.id), usedAt: text("used_at"), createdAt,
}, (table) => [uniqueIndex("uq_activation_codes_hash").on(table.codeHash), index("idx_activation_codes_cohort").on(table.cohortId)]);

export const consents = sqliteTable("consents", {
  id: text("id").primaryKey(), membershipId: text("membership_id").notNull().references(() => memberships.id), aiFoodImageConsent: integer("ai_food_image_consent", { mode: "boolean" }).notNull(), researchConsent: integer("research_consent", { mode: "boolean" }).notNull(), version: text("version").notNull(), withdrawnAt: text("withdrawn_at"), createdAt,
}, (table) => [index("idx_consents_membership").on(table.membershipId)]);

export const mealRecords = sqliteTable("meal_records", {
  id: text("id").primaryKey(), membershipId: text("membership_id").notNull().references(() => memberships.id), mealDate: text("meal_date").notNull(), mealType: text("meal_type").notNull(), source: text("source").notNull(), status: text("status").notNull(), visibility: text("visibility").notNull().default("private"), proteinMinG: integer("protein_min_g"), proteinMaxG: integer("protein_max_g"), imageObjectKey: text("image_object_key"), deletedAt: text("deleted_at"), createdAt,
}, (table) => [index("idx_meals_member_date").on(table.membershipId, table.mealDate), index("idx_meals_visibility").on(table.visibility)]);

export const bodyMeasurements = sqliteTable("body_measurements", {
  id: text("id").primaryKey(), membershipId: text("membership_id").notNull().references(() => memberships.id), measuredAt: text("measured_at").notNull(), instrument: text("instrument").notNull(), weightKg: text("weight_kg").notNull(), bmi: text("bmi").notNull(), waistCm: text("waist_cm").notNull(), waistHipRatio: text("waist_hip_ratio").notNull(), skeletalMuscleKg: text("skeletal_muscle_kg").notNull(), bodyFatKg: text("body_fat_kg").notNull(), bodyFatPercent: text("body_fat_percent").notNull(), overrideReason: text("override_reason"), createdAt,
}, (table) => [index("idx_measurements_member_time").on(table.membershipId, table.measuredAt)]);

export const lifestyleReviews = sqliteTable("lifestyle_reviews", {
  id: text("id").primaryKey(), membershipId: text("membership_id").notNull().references(() => memberships.id), weekNumber: integer("week_number").notNull(), sleepQuality: integer("sleep_quality").notNull(), exerciseDays: integer("exercise_days").notNull(), exerciseMinutes: integer("exercise_minutes").notNull(), createdAt,
}, (table) => [uniqueIndex("uq_lifestyle_member_week").on(table.membershipId, table.weekNumber)]);

export const weeklySummaries = sqliteTable("weekly_summaries", {
  id: text("id").primaryKey(), membershipId: text("membership_id").notNull().references(() => memberships.id), weekNumber: integer("week_number").notNull(), affirmation: text("affirmation").notNull(), priority: text("priority").notNull(), nextAction: text("next_action").notNull(), authorUserId: text("author_user_id").notNull().references(() => users.id), createdAt,
}, (table) => [uniqueIndex("uq_summary_member_week").on(table.membershipId, table.weekNumber)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(), cohortId: text("cohort_id").notNull().references(() => cohorts.id), actorUserId: text("actor_user_id").notNull().references(() => users.id), entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(), action: text("action").notNull(), beforeJson: text("before_json").notNull(), afterJson: text("after_json").notNull(), reason: text("reason").notNull(), createdAt,
}, (table) => [index("idx_audit_cohort_time").on(table.cohortId, table.createdAt), index("idx_audit_entity").on(table.entityType, table.entityId)]);
