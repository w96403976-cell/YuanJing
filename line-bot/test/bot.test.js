import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifySignature, textMessage } from '../src/line.js';
import { matchFaq, detectLead } from '../src/faq.js';
import { answerFor } from '../src/index.js';
import { cleanAnswer } from '../src/ai.js';
import worker from '../src/index.js';

const SECRET = 'test-secret';
const sign = body => createHmac('sha256', SECRET).update(body).digest('base64');

// 假 KV 與假 AI
const kv = () => { const m = new Map(); return { get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); }, m }; };
const env = (over = {}) => ({ LINE_CHANNEL_SECRET: SECRET, LINE_CHANNEL_ACCESS_TOKEN: 'x', AI_DAILY_LIMIT: '2', USAGE: kv(),
  AI: { calls: 0, async run() { this.calls++; return { response: '<think>…</think>**您好**，我們可以協助評估。' }; } }, ...over });

test('簽章驗證', async () => {
  const body = '{"events":[]}';
  assert.equal(await verifySignature(body, sign(body), SECRET), true);
  assert.equal(await verifySignature(body, sign(body + 'x'), SECRET), false);
  assert.equal(await verifySignature(body, null, SECRET), false);
});

test('FAQ 關鍵字與按鈕', () => {
  assert.equal(matchFaq('聯絡我們').id, 'contact');
  assert.equal(matchFaq('公司介紹').id, 'about');
  assert.equal(matchFaq('設備與量測').id, 'metrology');
  assert.equal(matchFaq('合作實績').id, 'clients');
  assert.equal(matchFaq('報價').id, 'quote');
  assert.equal(matchFaq('參觀預約').id, 'visit');
  assert.equal(matchFaq('報價詢問').id, 'quote');
  assert.equal(matchFaq('Hi').id, 'greeting');
  assert.equal(matchFaq('machine'), null, 'hi 不可命中 machine');
});

test('長問句交給 AI', () => {
  assert.equal(matchFaq('我們是做電動機車的，想問你們能不能幫忙設計一條新的電池組裝產線並且估計大概時程'), null);
});

test('AI 回答會清掉思考段落與 Markdown，且計入用量', async () => {
  const e = env();
  const r = await answerFor('請問電動機車電池模組的組裝治具可以從設計一路做到驗收嗎？', e, null);
  assert.equal(r.source, 'ai');
  assert.match(r.text, /^您好，我們可以協助評估。\n\n🤖 以上為 AI 自動回覆/);
  assert.equal([...e.USAGE.m.values()][0], '1');
});

test('超過每日上限回固定訊息，不再呼叫 AI', async () => {
  const e = env({ AI_DAILY_LIMIT: '1' });
  const q = '請問電動機車電池模組的組裝治具可以從設計一路做到驗收嗎？';
  await answerFor(q, e, null);
  const r = await answerFor(q, e, null);
  assert.equal(r.source, 'limit');
  assert.equal(e.AI.calls, 1);
  assert.match(r.text, /專人/);
});

test('AI 出錯（例如免費額度用完）回固定訊息', async () => {
  const e = env({ AI: { async run() { throw new Error('4006: daily free allocation exceeded'); } } });
  const r = await answerFor('請問電動機車電池模組的組裝治具可以從設計一路做到驗收嗎？', e, null);
  assert.equal(r.source, 'error');
});

test('webhook：錯誤簽章 401、正確簽章 200 並回覆 LINE', async () => {
  const sent = [];
  globalThis.fetch = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return new Response('{}'); };
  const body = JSON.stringify({ events: [{ type: 'message', replyToken: 'rt', source: { type: 'user', userId: 'U1' }, message: { type: 'text', text: '聯絡我們' } }] });
  const bad = await worker.fetch(new Request('https://x/webhook', { method: 'POST', body, headers: { 'x-line-signature': 'nope' } }), env(), { waitUntil() {} });
  assert.equal(bad.status, 401);
  const jobs = [];
  const ok = await worker.fetch(new Request('https://x/webhook', { method: 'POST', body, headers: { 'x-line-signature': sign(body) } }), env(), { waitUntil: p => jobs.push(p) });
  assert.equal(ok.status, 200);
  await Promise.all(jobs);
  const r = sent.find(s => s.url.endsWith('/message/reply'));
  assert.equal(r.body.replyToken, 'rt');
  assert.match(r.body.messages[0].text, /聯絡原鯨企業/);
  assert.equal(r.body.messages[0].quickReply.items.length, 5);
});

test('問候語不搶主題、介紹不誤判、官網有答案', () => {
  assert.equal(matchFaq('你好，報價？').id, 'quote');
  assert.equal(matchFaq('哈囉 地址').id, 'contact');
  assert.equal(matchFaq('你好').id, 'greeting');
  assert.equal(matchFaq('幫我翻譯 hello'), null);
  assert.equal(matchFaq('麻煩介紹報價').id, 'quote');
  assert.equal(matchFaq('官方網站').id, 'website');
  assert.equal(matchFaq('服務過哪些車廠').id, 'clients');
  assert.equal(matchFaq('有哪些機器').id, 'equipment');
});

test('預約／報價資料固定回「已收到」，不交給 AI', async () => {
  assert.equal(detectLead('大明工業 王小明，電話 0912-345-678，想約 11/20 下午2點，3 位'), 'visit');
  assert.equal(detectLead('台中精密 林小姐，需要點焊治具 5 套，電話 04-2345-6789'), 'quote');
  assert.equal(detectLead('請問你們可以做點焊治具嗎'), null);
  const e = env();
  const r = await answerFor('大明工業 王小明，電話 0912-345-678，想約 11/20 下午2點，3 位', e, null);
  assert.equal(r.source, 'lead:visit');
  assert.equal(e.AI.calls, 0);
  assert.match(r.text, /以專人確認為準/);
});

test('提到客戶或相關公司名稱：固定回答、不叫 AI、不重複名稱', async () => {
  const e = env();
  for (const q of ['你們和大陸新展是什麼關係？', '聽說你們有幫華擎做治具，是真的嗎', 'Do you work with Toyota?']) {
    const r = await answerFor(q, e, null);
    assert.equal(r.source, 'protected');
    assert.doesNotMatch(r.text, /新展|華擎|Toyota/i);
  }
  assert.equal(e.AI.calls, 0);
});

test('英文提問判斷', async () => {
  const { isEnglish } = await import('../src/ai.js');
  assert.equal(isEnglish('Do you make welding jigs?'), true);
  assert.equal(isEnglish('你們有 CNC 嗎'), false);
});

test('只有 AI 回答加上 AI 標示，固定答案不加', async () => {
  const e = env();
  const ai = await answerFor('請問電動機車電池模組的組裝治具可以從設計一路做到驗收嗎？', e, null);
  assert.match(ai.text, /🤖 以上為 AI 自動回覆/);
  const en = await answerFor('Can you design a battery module assembly fixture for us?', e, null);
  assert.match(en.text, /generated by AI/);
  for (const q of ['報價', '大明工業 王小明，電話 0912-345-678，想約 11/20 下午2點，3 位', '你們客戶有國瑞嗎']) {
    assert.doesNotMatch((await answerFor(q, e, null)).text, /🤖/);
  }
});

test('訊息長度與快速回覆限制', () => {
  const m = textMessage('x'.repeat(6000), ['一', '二']);
  assert.ok(m.text.length <= 5000);
  assert.equal(m.quickReply.items[0].action.text, '一');
});
