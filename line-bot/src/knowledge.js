// 原鯨企業的公司資料：FAQ 固定答案與 AI 回答都只根據這裡的內容。
// 聯絡資訊尚未提供，填好後 FAQ 與 AI 會自動帶出。空字串代表「不顯示」。
export const CONTACT = {
  phone: '',    // 例：'04-1234-5678'
  fax: '',
  email: '',
  address: '',
  hours: '',    // 例：'週一至週五 08:00–17:00'
};

export const COMPANY = `
公司名稱：原鯨企業有限公司
成立：2004 年 12 月
廠房：佔地 350 坪
特色：擁有優秀的自有設計團隊；以品質、納期為第一優先，深獲業界肯定與好評。
沿革：2008 年起與先構技研合作，推動數位工場自動化。

核心業務：
1. 自動化設計製造：機器人應用、自動組裝與自動鎖付設備，從設計到製造。
2. 整廠 LAYOUT 規劃：依產線需求規劃整廠配置，整合自動化設備與治具。
3. 汽機車夾治具：車身組立、點焊、沖孔治具，以及引擎加工治具。

設備：
- 加工：CNC 加工機、車床機、旋臂鑽床機、立式鑽床機、攻牙機、帶鋸機、切斷砂輪機、離子切割機
- 焊接：氬焊機、電焊機、氣焊機
- 量測：3×6 米三次元量測機、移動式 FARO、微米用量具
- 其他：空壓機、電腦工作站

代表實績：
- 自動化：第七軸取放系統、塑膠刀套自動組裝系統、刀盤組裝系統、ROBOT 打點系統、RUNNER 四軸角鍊自動鎖付機台
- 車身治具：FR FLR 前底板組立治具、T/G PUNCH 後背門沖孔治具、MAIN JIG、T/LID-INR 後倉蓋治具、FR-DR-OP10 點焊治具、RH／LH SIDE 治具、RH／LH SIDE PUNCH 治具
- 引擎加工治具：BLOCK OP60、ASSY OP40、LOWER CASE OP10

合作客戶（對外不揭露客戶名稱）：
- 國內十餘家企業：日系 OEM 台灣組裝廠與子公司、台灣汽車製造商、台灣自主品牌車廠集團、商用車製造商、Tier 1 汽車零組件大廠、汽車零組件與精密機械廠
- 海外：德系國際 OEM、中國大陸合資車廠
`.trim();

export function contactText() {
  const rows = [
    CONTACT.phone && `電話：${CONTACT.phone}`,
    CONTACT.fax && `傳真：${CONTACT.fax}`,
    CONTACT.email && `Email：${CONTACT.email}`,
    CONTACT.address && `地址：${CONTACT.address}`,
    CONTACT.hours && `營業時間：${CONTACT.hours}`,
  ].filter(Boolean);
  return rows.length
    ? rows.join('\n')
    : '請直接在這個聊天室留下您的公司、聯絡方式與需求，我們的同仁會盡快回覆您。';
}

export function systemPrompt() {
  return `你是「原鯨企業有限公司」LINE 官方帳號的客服助理。

規則：
- 一律使用繁體中文（台灣用語），語氣專業、親切、簡潔，回答控制在 150 字以內。
- 只能根據下方「公司資料」回答。資料沒有的內容（價格、交期天數、精度數值、人數、具體規格、客戶名稱等）不可猜測或編造，請說明需由專人評估，並引導對方留下需求或聯絡我們。
- 絕對不要提到任何客戶的公司名稱，只能用資料中的客戶類別描述。
- 與公司業務無關的問題，禮貌說明你只能回答原鯨企業相關問題。
- 不要使用 Markdown 語法（不要用 **、#、表格），可用「・」條列。

公司資料：
${COMPANY}

聯絡方式：
${contactText()}`;
}
