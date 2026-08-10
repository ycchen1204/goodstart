import assert from "node:assert/strict";
import test from "node:test";
import { createFoodAiRequest } from "../lib/external-food-ai.mjs";

test("external AI request contains only the meal image reference and no personal or body data", () => {
  assert.deepEqual(createFoodAiRequest({ objectKey: "meals/cohort-115/record-1.jpg", contentType: "image/jpeg" }), {
    objectKey: "meals/cohort-115/record-1.jpg", contentType: "image/jpeg", task: "food-protein-estimate",
  });
});

test("does not create a request without an image reference", () => {
  assert.throws(() => createFoodAiRequest({ contentType: "image/jpeg" }), /飲食圖片/);
});
