// Workers AI 回答 + 每日用量上限（以 KV 計數，UTC 每日重置，與 Cloudflare 免費額度同步）
import { systemPrompt, contactText } from './knowledge.js';

export const FALLBACK = () => `謝謝您的提問！目前由專人為您回覆，請稍候。\n若需要立即聯繫：\n${contactText()}`;

const today = () => new Date().toISOString().slice(0, 10);

export async function underDailyLimit(env) {
  const limit = Number(env.AI_DAILY_LIMIT || 500);
  if (!env.USAGE) return true;
  const used = Number(await env.USAGE.get(`ai:${today()}`)) || 0;
  return used < limit;
}

export async function countUsage(env) {
  if (!env.USAGE) return;
  const key = `ai:${today()}`;
  const used = Number(await env.USAGE.get(key)) || 0;
  await env.USAGE.put(key, String(used + 1), { expirationTtl: 60 * 60 * 48 });
}

export function cleanAnswer(s) {
  return String(s || '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')   // Qwen3 的思考段落
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .trim();
}

export async function askAI(env, question) {
  const res = await env.AI.run(env.AI_MODEL || '@cf/qwen/qwen3-30b-a3b-fp8', {
    messages: [
      { role: 'system', content: systemPrompt() },
      { role: 'user', content: `${question.slice(0, 500)} /no_think` },
    ],
    max_tokens: 400,
    temperature: 0.3,
  });
  // 不同模型的回傳格式不一，兩種都接
  const text = res?.response ?? res?.choices?.[0]?.message?.content;
  const answer = cleanAnswer(text);
  if (!answer) throw new Error('empty AI answer');
  return answer;
}
