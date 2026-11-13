# 原鯨企業 LINE 問答機器人

LINE Messaging API ＋ Cloudflare Workers ＋ Workers AI。

- **FAQ 優先**：公司介紹、業務、設備、量測、實績、報價、聯絡等常見問題用固定答案，不耗 AI 額度。
- **AI 補位**：其他問題交給 Workers AI（`@cf/qwen/qwen3-30b-a3b-fp8`），只根據 `src/knowledge.js` 的公司資料回答，不會透露客戶名稱、不編造價格或規格。
- **額度保護**：每天最多呼叫 AI `AI_DAILY_LIMIT` 次（預設 500，約 7,500 neurons，低於免費的 10,000）；超過或 AI 出錯時，回「由專人回覆」＋聯絡方式。
- 每則回覆下方都有快速按鈕：公司介紹／核心業務／設備與量測／合作實績／聯絡我們。

## 檔案

| 檔案 | 用途 |
|---|---|
| `src/knowledge.js` | 公司資料、**聯絡資訊**、AI 回答規則（要改內容改這裡） |
| `src/faq.js` | 常見問題的關鍵字與固定答案 |
| `src/ai.js` | Workers AI 呼叫與每日用量計數 |
| `src/line.js` | LINE 簽章驗證、回覆、輸入中動畫 |
| `src/index.js` | Webhook 入口 |
| `wrangler.toml` | Cloudflare 設定（模型、每日上限、KV） |

## 一次性設定

### 1. 建立 LINE Messaging API
1. [LINE Official Account Manager](https://manager.line.biz/) → 設定 → **Messaging API** → 啟用 Messaging API（選擇或建立 Provider）。
2. 到 [LINE Developers Console](https://developers.line.biz/console/) → 該 Channel：
   - **Basic settings** → 記下 **Channel secret**
   - **Messaging API** → 最下方 **Channel access token (long-lived)** → Issue，記下 token
3. 回到 Official Account Manager → 設定 → **回應設定**：
   - Webhook：**開啟**
   - 自動回應訊息：**關閉**（不然會和機器人重複回覆）
   - 聊天：可保持開啟，同仁仍能在後台手動接手對話

### 2. 部署到 Cloudflare（在 `line-bot/` 資料夾執行）
```bash
npm install
```
```bash
npx wrangler login
```
用來計數的 KV 不用手動建立，第一次部署時會自動建立。接著設定兩個機密（會提示你貼上，不會存進程式碼）：
```bash
npx wrangler secret put LINE_CHANNEL_SECRET
```
```bash
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
```
```bash
npx wrangler deploy
```
部署完成會顯示網址，例如 `https://yuanjing-line-bot.<你的子網域>.workers.dev`。

### 3. 接上 Webhook
LINE Developers Console → Messaging API → **Webhook URL** 填：
```
https://yuanjing-line-bot.<你的子網域>.workers.dev/webhook
```
按 **Verify** 出現 Success，並開啟 **Use webhook**。

### 4. 圖文選單按鈕設定
- 左「認識原鯨」：類型「連結」→ 官網網址
- 右「聯絡我們」：類型「文字」→ `聯絡我們`（機器人會回聯絡資訊）

## 日常維護

- **改公司資料或聯絡方式**：編輯 `src/knowledge.js`，然後 `npx wrangler deploy`。
- **新增常見問題**：在 `src/faq.js` 的 `FAQ` 陣列加一筆 `keywords` ＋ `answer`。
- **調整每日 AI 上限或換模型**：改 `wrangler.toml` 的 `AI_DAILY_LIMIT`／`AI_MODEL`。
- **看用量**：Cloudflare Dashboard → AI → Workers AI；即時 log：`npx wrangler tail`。
- **測試**：`npm test`（不需網路與帳號）。

## 費用說明
- Workers 免費方案：每天 100,000 次請求。
- Workers AI：每天 10,000 neurons 免費（UTC 00:00＝台灣早上 8 點重置）。免費方案用完後 AI 會直接失敗、不會扣款，機器人改回固定訊息。若帳號升級為 Workers 付費方案，超過免費額度會計費，`AI_DAILY_LIMIT` 就是用來擋這個的。
- KV 免費方案：每天 1,000 次寫入（每次 AI 回答寫 1 次）。
