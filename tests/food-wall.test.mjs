import assert from "node:assert/strict";
import test from "node:test";
import { buildLeaderboard, visibleFoodWallPosts } from "../lib/food-wall.mjs";

const posts = [
  { id: "a", cohortId: "115", visibility: "cohort", mealType: "午餐", proteinRange: { min: 18, max: 25 }, weight: 50 },
  { id: "b", cohortId: "115", visibility: "private", mealType: "晚餐", proteinRange: { min: 20, max: 28 } },
  { id: "c", cohortId: "116", visibility: "cohort", mealType: "早餐", proteinRange: { min: 12, max: 18 } },
];

test("only exposes cohort-public food posts from the same cohort", () => {
  assert.deepEqual(visibleFoodWallPosts(posts, "115"), [
    { id: "a", mealType: "午餐", proteinRange: { min: 18, max: 25 } },
  ]);
});

test("leaderboard gives one point per complete day and caps each week at seven", () => {
  const board = buildLeaderboard([
    { member: "林小雨", optedIn: true, completeDays: 9 },
    { member: "陳大明", optedIn: true, completeDays: 4 },
    { member: "王小安", optedIn: false, completeDays: 7 },
  ]);

  assert.deepEqual(board, [
    { member: "林小雨", points: 7, rank: 1 },
    { member: "陳大明", points: 4, rank: 2 },
  ]);
});

test("leaderboard preserves shared ranks for equal scores", () => {
  assert.deepEqual(buildLeaderboard([
    { member: "A", optedIn: true, completeDays: 4 },
    { member: "B", optedIn: true, completeDays: 4 },
    { member: "C", optedIn: true, completeDays: 2 },
  ]), [
    { member: "A", points: 4, rank: 1 },
    { member: "B", points: 4, rank: 1 },
    { member: "C", points: 2, rank: 3 },
  ]);
});
