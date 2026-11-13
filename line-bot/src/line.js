// LINE Messaging API 小工具：簽章驗證、回覆、載入動畫
const API = 'https://api.line.me/v2/bot';

export async function verifySignature(body, signature, secret) {
  if (!signature || !secret) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  // 長度相同才逐字比對，避免時間差洩漏
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

export function textMessage(text, quick = []) {
  const msg = { type: 'text', text: text.slice(0, 4900) };
  if (quick.length) {
    msg.quickReply = { items: quick.slice(0, 13).map(label => ({ type: 'action', action: { type: 'message', label: label.slice(0, 20), text: label } })) };
  }
  return msg;
}

export async function reply(token, messages, accessToken) {
  const res = await fetch(`${API}/message/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ replyToken: token, messages }),
  });
  if (!res.ok) console.error('LINE reply failed', res.status, await res.text());
}

// 一對一聊天時顯示「輸入中」動畫，等 AI 回覆期間用
export async function startLoading(userId, accessToken) {
  try {
    await fetch(`${API}/chat/loading/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ chatId: userId, loadingSeconds: 20 }),
    });
  } catch (e) { /* 動畫失敗不影響回覆 */ }
}
