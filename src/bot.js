import { env } from './config.js';
import { db, upsertUser, getSetting, setSetting, getUser, isAdmin, adminIds } from './db.js';
import { tg, send, sendRich, esc, fmt } from './telegram.js';
import { decideTopup } from './topups.js';
import crypto from 'node:crypto';

export const tgWebhookSecret = () =>
  crypto.createHash('sha256').update('tg-webhook:' + env.BOT_TOKEN).digest('hex').slice(0, 40);
const tgWebhookUrl = () => `${env.PUBLIC_URL}/tg/webhook/${tgWebhookSecret()}`;
const ALLOWED = ['message', 'callback_query'];

export async function handleUpdate(u) {
  const who = u.message?.from || u.callback_query?.from;
  console.log(`[bot] update ${u.update_id} from ${who?.id} ${who?.username ? '@' + who.username : ''}: ${(u.message?.text || u.callback_query?.data || '(media)').slice(0, 40)}`);
  try {
    if (u.message) await onMessage(u.message);
    else if (u.callback_query) await onCallback(u.callback_query);
  } catch (e) {
    console.error('[bot] update xatosi', e);
  }
}

async function ensureWebhook(force = false) {
  const info = await tg('getWebhookInfo');
  if (info?.last_error_message) console.warn('[bot] webhook oxirgi xato:', info.last_error_message);
  if (!force && info && info.url === tgWebhookUrl()) return;
  const ok = await tg('setWebhook', { url: tgWebhookUrl(), secret_token: tgWebhookSecret(), allowed_updates: ALLOWED, max_connections: 40 });
  console.log('[bot] webhook o‘rnatildi:', !!ok);
}


const webAppUrl = (path = '') => `${env.PUBLIC_URL}/app${path}`;

function startKeyboard() {
  const rows = [];
  if (env.PUBLIC_URL.startsWith('https://'))
    rows.push([{ text: '🛒 Xaridni boshlash', web_app: { url: webAppUrl() } }]);
  const row2 = [];
  const ch = getSetting('channel_url');
  const sp = getSetting('support_url');
  if (ch) row2.push({ text: 'Bizning kanal', url: ch });
  if (sp) row2.push({ text: 'Yordam', url: sp });
  if (row2.length) rows.push(row2);
  return { inline_keyboard: rows };
}

async function sendStart(chatId, user) {
  const name = esc(user.first_name || user.username || 'do‘st');
  const caption = getSetting('welcome_text').replace(/\{name\}/g, `<b>${name}</b>`);
  const photo = getSetting('welcome_photo') || (env.PUBLIC_URL ? `${env.PUBLIC_URL}/logo.jpg` : '');
  const reply_markup = startKeyboard();
  const sent = photo
    ? await tg('sendPhoto', { chat_id: chatId, photo, caption, parse_mode: 'HTML', reply_markup })
    : null;
  if (!sent) await send(chatId, caption, { reply_markup });
}

// START bosilmagan bo'sh chatda ko'rinadigan matn
async function setDescriptions() {
  const shop = getSetting('shop_name') || 'Donat';
  await tg('setMyDescription', {
    description: `🎮 ${shop} — o‘yinlarga tez va xavfsiz donat.\n\nPUBG UC, Free Fire olmos, Mobile Legends, Telegram Stars va Premium, 200+ o‘yin.\n\n👇 Boshlash uchun «START» tugmasini bosing.`,
  });
  await tg('setMyShortDescription', { short_description: `🎮 ${shop}: PUBG, Free Fire, MLBB, Telegram Stars — tez va xavfsiz donat` });
}

async function onMessage(msg) {
  const from = msg.from;
  if (!from || msg.chat.type !== 'private') return;
  const text = msg.text || msg.caption || '';
  let refBy = null;
  const m = /^\/start(?:\s+ref(\d+))?/.exec(text);
  if (m?.[1]) refBy = Number(m[1]);
  const { user } = upsertUser(from, refBy);

  if (isAdmin(from.id)) {
    if (/^\/setphoto/.test(text) && msg.photo?.length) {
      setSetting('welcome_photo', msg.photo[msg.photo.length - 1].file_id);
      return send(from.id, '✅ /start rasmi yangilandi.');
    }
    if (/^\/admin/.test(text)) {
      return send(from.id, '⚙️ Admin panel:', {
        reply_markup: { inline_keyboard: [[{ text: '⚙️ Admin panelni ochish', web_app: { url: webAppUrl('#/admin') } }]] },
      });
    }
  }
  if (user.banned) return send(from.id, '⛔ Hisobingiz bloklangan.');
  if (/^\/balans/.test(text)) return send(from.id, `💰 Balansingiz: <b>${fmt(user.balance)}</b>`);
  return sendStart(from.id, user);
}

async function onCallback(cq) {
  const data = cq.data || '';
  const m = /^tp:(ok|no):(\d+)$/.exec(data);
  if (!m) return tg('answerCallbackQuery', { callback_query_id: cq.id });
  if (!isAdmin(cq.from.id)) return tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Ruxsat yo‘q' });
  try {
    const res = await decideTopup(Number(m[2]), m[1] === 'ok', cq.from.id);
    const label = res.already
      ? `ℹ️ Avval hal qilingan: ${res.t.status === 'approved' ? 'tasdiqlangan' : 'rad etilgan'}`
      : m[1] === 'ok'
        ? `✅ Tasdiqlandi: +${fmt(res.t.amount)}`
        : '❌ Rad etildi';
    await tg('answerCallbackQuery', { callback_query_id: cq.id, text: label });
    if (cq.message) {
      await tg('editMessageCaption', {
        chat_id: cq.message.chat.id,
        message_id: cq.message.message_id,
        caption: (cq.message.caption || '') + '\n\n' + label,
        reply_markup: { inline_keyboard: [] },
      });
    }
  } catch (e) {
    await tg('answerCallbackQuery', { callback_query_id: cq.id, text: e.message, show_alert: true });
  }
}

export async function startBot() {
  if (!env.BOT_TOKEN || env.DISABLE_BOT) {
    console.log('[bot] o‘chirilgan (BOT_TOKEN yo‘q yoki DISABLE_BOT=1)');
    return;
  }
  const me = await tg('getMe');
  console.log('[bot] ishga tushdi:', me?.username || '(getMe javob bermadi)');
  await setDescriptions();
  await tg('setMyCommands', {
    commands: [
      { command: 'start', description: 'Bosh menyu' },
      { command: 'balans', description: 'Balansim' },
    ],
  });
  for (const id of adminIds()) await setAdminCommands(id);

  if (env.PUBLIC_URL.startsWith('https://')) {
    await tg('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Menyu', web_app: { url: webAppUrl() } } });
    // Webhook: Telegram xabarlarni o'zi serverga yuboradi — osilib qoladigan polling yo'q
    await ensureWebhook(true);
    setInterval(() => ensureWebhook().catch(() => {}), 5 * 60 * 1000).unref();
    return;
  }

  // Lokal: polling (har bir so'rovga qattiq vaqt chegarasi bilan)
  await tg('deleteWebhook', { drop_pending_updates: false });
  let offset = 0;
  (async function loop() {
    for (;;) {
      const updates = await Promise.race([
        tg('getUpdates', { offset, timeout: 25, allowed_updates: ALLOWED }),
        new Promise((r) => setTimeout(() => r(null), 40000)),
      ]);
      if (!updates) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      for (const u of updates) {
        offset = u.update_id + 1;
        await handleUpdate(u);
      }
    }
  })();
}

export async function setAdminCommands(id, on = true) {
  const scope = { type: 'chat', chat_id: id };
  if (!on) return tg('deleteMyCommands', { scope });
  const r = await tg('setMyCommands', {
    scope,
    commands: [
      { command: 'start', description: 'Bosh menyu' },
      { command: 'admin', description: 'Admin panel' },
      { command: 'balans', description: 'Balansim' },
    ],
  });
  if (!r) console.warn(`[bot] admin ${id} hali botga /start bosmagan (yoki ID noto‘g‘ri)`);
  return r;
}

// Hammaga xabar — holati admin panelda ko'rinadi
export const broadcastState = { running: false, total: 0, done: 0, ok: 0, started_at: null, finished_at: null };
export function broadcast(msg) {
  if (broadcastState.running) return false;
  const ids = db.prepare('select id from users where banned=0').all().map((r) => r.id);
  Object.assign(broadcastState, { running: true, total: ids.length, done: 0, ok: 0, started_at: new Date().toISOString(), finished_at: null });
  (async () => {
    let photo = msg.photo;
    for (const id of ids) {
      try {
        const r = await sendRich(id, { ...msg, photo });
        if (r) {
          broadcastState.ok++;
          // Rasm bir marta yuklanadi, keyin file_id bilan yuboriladi
          if (Buffer.isBuffer(photo) && r.photo?.length) photo = r.photo[r.photo.length - 1].file_id;
        }
      } catch (e) {
        console.warn('[broadcast]', id, e.message);
      }
      broadcastState.done++;
      await new Promise((r) => setTimeout(r, 45));
    }
    broadcastState.running = false;
    broadcastState.finished_at = new Date().toISOString();
  })();
  return true;
}
