import { env } from './config.js';

// Qattiq muddat: AbortSignal ishlamay qolsa ham so'rov abadiy osilib qolmaydi
export const deadline = (promise, ms, label) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error(`${label}: vaqt tugadi`)), ms).unref?.())]);

const api = (m) => `https://api.telegram.org/bot${env.BOT_TOKEN}/${m}`;

export async function tg(method, body = {}) {
  if (!env.BOT_TOKEN) return null;
  try {
    const ms = method === 'getUpdates' ? 60000 : 20000;
    const j = await deadline((async () => {
      const r = await fetch(api(method), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(ms),
      });
      return r.json();
    })(), ms + 5000, method);
    if (!j.ok) console.warn(`[tg] ${method} xato:`, j.description);
    return j.ok ? j.result : null;
  } catch (e) {
    if (method !== 'getUpdates') console.warn(`[tg] ${method} ulanish xatosi:`, e.message);
    return null;
  }
}

// Rasm (Buffer) yuborish — chek rasmlari uchun
export async function sendPhotoBuffer(chatId, buffer, mime, caption, reply_markup) {
  if (!env.BOT_TOKEN) return null;
  const fd = new FormData();
  fd.append('chat_id', String(chatId));
  fd.append('photo', new Blob([buffer], { type: mime || 'image/jpeg' }), 'chek.jpg');
  if (caption) {
    fd.append('caption', caption);
    fd.append('parse_mode', 'HTML');
  }
  if (reply_markup) fd.append('reply_markup', JSON.stringify(reply_markup));
  try {
    const j = await deadline((async () => {
      const r = await fetch(api('sendPhoto'), { method: 'POST', body: fd, signal: AbortSignal.timeout(30000) });
      return r.json();
    })(), 35000, 'sendPhoto');
    if (!j.ok) console.warn('[tg] sendPhoto xato:', j.description);
    return j.ok ? j.result : null;
  } catch (e) {
    console.warn('[tg] sendPhoto ulanish xatosi:', e.message);
    return null;
  }
}

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/,/g, ' ') + ' so‘m';

export const send = (chatId, text, extra = {}) =>
  tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });

export async function notifyAdmins(text, extra = {}) {
  for (const id of env.ADMIN_IDS) await send(id, text, extra);
}

export function userLabel(u) {
  if (!u) return '—';
  const name = esc([u.first_name, u.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi');
  return `<a href="tg://user?id=${u.id}">${name}</a>${u.username ? ' @' + esc(u.username) : ''} (<code>${u.id}</code>)`;
}
