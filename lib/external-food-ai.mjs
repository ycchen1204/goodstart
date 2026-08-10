export function createFoodAiRequest({ objectKey, contentType }) {
  if (!objectKey) throw new Error("院外 AI 分析需要飲食圖片參考。 ");
  return { objectKey, contentType, task: "food-protein-estimate" };
}
