import { env, isAdmin } from './config.js';
import { db, upsertUser, getSetting, setSetting, getUser } from './db.js';
import { tg, send, esc, fmt } from './telegram.js';
import { decideTopup } from './topups.js';

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
  console.log('[bot] ishga tushdi:', me?.username);
  await tg('deleteWebhook', { drop_pending_updates: false });
  await tg('setMyCommands', {
    commands: [
      { command: 'start', description: 'Bosh menyu' },
      { command: 'balans', description: 'Balansim' },
    ],
  });
  for (const id of env.ADMIN_IDS) {
    await tg('setMyCommands', {
      scope: { type: 'chat', chat_id: id },
      commands: [
        { command: 'start', description: 'Bosh menyu' },
        { command: 'admin', description: 'Admin panel' },
        { command: 'balans', description: 'Balansim' },
      ],
    });
  }
  if (env.PUBLIC_URL.startsWith('https://')) {
    await tg('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Menyu', web_app: { url: webAppUrl() } } });
  }

  let offset = 0;
  (async function loop() {
    for (;;) {
      const updates = await tg('getUpdates', { offset, timeout: 50, allowed_updates: ['message', 'callback_query'] });
      if (!updates) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      for (const u of updates) {
        offset = u.update_id + 1;
        try {
          if (u.message) await onMessage(u.message);
          else if (u.callback_query) await onCallback(u.callback_query);
        } catch (e) {
          console.error('[bot] update xatosi', e);
        }
      }
    }
  })();
}

export async function broadcast(text) {
  const ids = db.prepare('select id from users where banned=0').all().map((r) => r.id);
  let ok = 0;
  for (const id of ids) {
    const r = await send(id, text);
    if (r) ok++;
    await new Promise((r) => setTimeout(r, 45));
  }
  return { total: ids.length, ok };
}
