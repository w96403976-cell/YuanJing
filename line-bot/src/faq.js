// 常見問題：關鍵字命中就回固定答案，不消耗 AI 額度。
import { contactText } from './knowledge.js';

// 每則訊息都附上的快速回覆按鈕
export const QUICK_TOPICS = ['公司介紹', '核心業務', '設備與量測', '合作實績', '聯絡我們'];

export const FAQ = [
  {
    id: 'greeting',
    keywords: ['你好', '您好', '哈囉', 'hello', 'hi', '嗨', '在嗎', '開始', '選單'],
    answer: () => '您好，這裡是原鯨企業 🐳\n我們專注於自動化設計製造、整廠 LAYOUT 規劃與汽機車夾治具。\n\n您可以點下方按鈕，或直接輸入您的問題。',
  },
  {
    id: 'about',
    keywords: ['公司介紹', '介紹', '簡介', '關於', '認識原鯨', '成立', '幾年', '歷史', '廠房', '規模'],
    answer: () => '原鯨企業有限公司成立於 2004 年 12 月，廠房佔地 350 坪，擁有自有設計團隊。\n我們以品質、納期為第一優先，2008 年起與先構技研合作，推動數位工場自動化。',
  },
  {
    id: 'services',
    keywords: ['核心業務', '業務', '服務', '做什麼', '產品', '營業項目', '項目', '能做'],
    answer: () => '我們的三大核心業務：\n・自動化設計製造：機器人應用、自動組裝與鎖付設備\n・整廠 LAYOUT 規劃：產線配置與設備整合\n・汽機車夾治具：車身組立、點焊、沖孔與引擎加工治具',
  },
  {
    id: 'automation',
    keywords: ['自動化', '機器人', 'robot', '手臂', '組裝', '鎖付', '取放'],
    answer: () => '自動化設計製造是我們的核心業務之一，從設計到製造一手完成。\n實績包含：第七軸取放系統、刀盤組裝系統、塑膠刀套自動組裝系統、ROBOT 打點系統、RUNNER 四軸角鍊自動鎖付機台。',
  },
  {
    id: 'layout',
    keywords: ['layout', '整廠', '產線', '規劃', '佈局', '配置'],
    answer: () => '我們提供整廠 LAYOUT 規劃，依您的產線需求規劃整廠配置，並整合自動化設備與治具。\n歡迎提供產品與產能需求，由專人與您討論。',
  },
  {
    id: 'jigs',
    keywords: ['治具', '夾具', '夾治具', 'jig', 'fixture', '點焊', '沖孔', 'punch', '引擎'],
    answer: () => '我們設計製造汽機車夾治具：\n・車身組立治具、點焊治具、沖孔（PUNCH）治具\n・引擎加工治具\n成品精度由廠內三次元量測機把關。',
  },
  {
    id: 'equipment',
    keywords: ['設備', '機台', 'cnc', '加工', '車床', '鑽床', '焊接', '切割', '工廠'],
    answer: () => '廠內加工設備：\n・CNC 加工機、車床機、旋臂／立式鑽床機、攻牙機\n・離子切割機、帶鋸機、切斷砂輪機\n・氬焊機、電焊機、氣焊機\n設計、加工、焊接到量測都在廠內完成。',
  },
  {
    id: 'metrology',
    keywords: ['量測', '測量', '三次元', 'cmm', 'faro', '精度', '檢驗', '品質', '量具', '設備與量測'],
    answer: () => '精密量測設備：\n・3×6 米三次元量測機\n・移動式 FARO\n・微米用量具\n每一套治具與設備都在廠內完成量測驗證。',
  },
  {
    id: 'clients',
    keywords: ['客戶', '實績', '案例', '合作實績', '作品', '經驗', '車廠', '合作過'],
    answer: () => '我們服務國內十餘家企業，包含日系 OEM 台灣組裝廠、台灣汽車製造商、商用車製造商、Tier 1 汽車零組件大廠等，海外則有德系國際 OEM 與中國大陸合資車廠。\n詳細案例歡迎參考官網或與我們聯繫。',
  },
  {
    id: 'quote',
    keywords: ['報價', '價格', '多少錢', '費用', '估價', '交期', '多久', '詢價'],
    answer: () => `報價與交期需依您的規格與需求評估。\n請留下：公司名稱、聯絡人、產品／工件資料（可附圖面）、預計數量與時程，我們會由專人回覆。\n\n${contactText()}`,
  },
  {
    id: 'visit',
    keywords: ['參觀預約', '預約參觀', '參觀', '拜訪', '看廠', '來訪', '預約'],
    answer: () => `歡迎蒞臨原鯨企業參觀！🐳\n請直接在這裡留下以下資料，我們會由專人與您確認時間：\n・公司名稱與聯絡人\n・聯絡電話\n・希望參觀的日期與時段（可提供 2–3 個選項）\n・來訪人數\n・想了解的設備或案例（選填）\n\n${contactText()}`,
  },
  {
    id: 'contact',
    keywords: ['聯絡我們', '聯絡', '聯繫', '電話', '地址', '在哪', '位置', 'email', '信箱', '營業時間', '業務窗口'],
    answer: () => `聯絡原鯨企業：\n${contactText()}\n\n歡迎蒞臨指導！`,
  },
];

const norm = s => s.toLowerCase().replace(/\s+/g, '');

// 回傳命中的 FAQ（取命中關鍵字最長者），長句只在命中夠明確時才用 FAQ，否則交給 AI
export function matchFaq(text) {
  const t = norm(text);
  if (!t) return null;
  let best = null, bestLen = 0;
  for (const f of FAQ) {
    for (const k of f.keywords) {
      const kk = norm(k);
      // 英文關鍵字要整字比對，避免 "hi" 命中 "machine"
      const hit = /^[a-z]+$/.test(kk) ? new RegExp(`(^|[^a-z])${kk}([^a-z]|$)`).test(t) : t.includes(kk);
      if (hit && kk.length > bestLen) { best = f; bestLen = kk.length; }
    }
  }
  if (!best) return null;
  // 短訊息（像按鈕、關鍵字）直接用 FAQ；長問句通常有細節，交給 AI 會更貼切
  if ([...t].length <= 15 || bestLen / [...t].length >= 0.3) return best;
  return null;
}
