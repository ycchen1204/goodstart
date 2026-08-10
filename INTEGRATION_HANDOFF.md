# 院內串接交接清單

請由資訊室以院內核准流程提供並設定下列項目；不應以電子郵件或原始碼傳遞密鑰。

1. 資料庫與檔案儲存：套用 `drizzle/0000_groovy_zemo.sql`，並將 D1 綁定為 `DB`、飲食圖片檔案儲存綁定為 `MEAL_IMAGES`。
2. LINE Login：`LINE_CHANNEL_ID`、`LINE_CHANNEL_SECRET`、核准的 `LINE_CALLBACK_URL`，以及可供院方使用的回呼網址。
3. 院外食物影像 AI：核准的 `EXTERNAL_FOOD_AI_BASE_URL`、模型名稱、金鑰與資料處理協議。呼叫內容只限已取得同意的飲食圖片；不得傳送姓名、病歷號、身體組成報告或其數值。
4. 營運與資安：資料保留期限、備份／復原、稽核讀取權限、刪除與撤回同意的作業責任人。

所有實際連線設定對應欄位已列於 `.env.example`，不得提交真實值。
