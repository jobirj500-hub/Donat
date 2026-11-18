import { db, getUser, changeBalance, getSetting, AppError } from './db.js';
import { env } from './config.js';
import { sendPhotoBuffer, send, tg, esc, fmt, userLabel } from './telegram.js';

export async function createTopup(userId, amount, dataUrl) {
  const user = getUser(userId);
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 'no_user', 404);
  if (user.banned) throw new AppError('Hisobingiz bloklangan', 'banned', 403);
  const min = Number(getSetting('min_topup')) || 0;
  const max = Number(getSetting('max_topup')) || 100000000;
  amount = Math.round(Number(amount));
  if (!Number.isFinite(amount) || amount < min) throw new AppError(`Eng kam summa: ${fmt(min)}`, 'bad_amount');
  if (amount > max) throw new AppError(`Eng ko‘p summa: ${fmt(max)}`, 'bad_amount');
  const m = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/.exec(String(dataUrl || ''));
  if (!m) throw new AppError('Chek rasmini yuklang', 'no_receipt');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 6 * 1024 * 1024) throw new AppError('Rasm juda katta (6 MB gacha)', 'too_big');

  const pending = db.prepare("select count(*) c from topups where user_id=? and status='pending'").get(userId).c;
  if (pending >= 3) throw new AppError('Sizda tekshirilayotgan to‘lovlar bor, biroz kuting', 'too_many');

  const id = db.prepare('insert into topups(user_id,amount) values(?,?)').run(userId, amount).lastInsertRowid;
  const caption = `💳 <b>To‘lov so‘rovi #${id}</b>\n${userLabel(user)}\nSumma: <b>${fmt(amount)}</b>\nJoriy balans: ${fmt(user.balance)}`;
  const markup = {
    inline_keyboard: [
      [
        { text: '✅ Tasdiqlash', callback_data: `tp:ok:${id}` },
        { text: '❌ Rad etish', callback_data: `tp:no:${id}` },
      ],
    ],
  };
  for (const admin of env.ADMIN_IDS) await sendPhotoBuffer(admin, buf, m[1], caption, markup);
  return db.prepare('select * from topups where id=?').get(id);
}

// Admin qarori (bot tugmasi yoki admin panel orqali)
export async function decideTopup(id, approve, adminId, amountOverride = null) {
  const res = db.transaction(() => {
    const t = db.prepare('select * from topups where id=?').get(id);
    if (!t) throw new AppError('So‘rov topilmadi', 'not_found', 404);
    if (t.status !== 'pending') return { t, already: true };
    const amount = amountOverride ? Math.round(Number(amountOverride)) : t.amount;
    db.prepare("update topups set status=?, amount=?, admin_note=?, decided_at=datetime('now') where id=?").run(
      approve ? 'approved' : 'rejected',
      amount,
      String(adminId),
      id,
    );
    let balance = null;
    if (approve) balance = changeBalance(t.user_id, amount, 'topup', 'T' + id, 'Balans to‘ldirildi');
    return { t: { ...t, amount, status: approve ? 'approved' : 'rejected' }, balance };
  })();
  if (!res.already) {
    const { t } = res;
    if (approve) {
      await send(t.user_id, `✅ <b>Balansingiz to‘ldirildi!</b>\n+${fmt(t.amount)}\nJoriy balans: <b>${fmt(res.balance)}</b>`);
      const u = getUser(t.user_id);
      const bonus = Number(getSetting('ref_bonus')) || 0;
      const first = db.prepare("select count(*) c from topups where user_id=? and status='approved'").get(t.user_id).c === 1;
      if (bonus > 0 && first && u?.ref_by && getUser(u.ref_by)) {
        changeBalance(u.ref_by, bonus, 'ref', 'R' + t.user_id, 'Do‘st taklifi bonusi');
        await send(u.ref_by, `🎁 Taklif qilgan do‘stingiz balansini to‘ldirdi. Sizga <b>${fmt(bonus)}</b> bonus!`);
      }
    } else {
      await send(t.user_id, `❌ <b>To‘lov so‘rovi #${t.id} rad etildi.</b>\nSavollar bo‘lsa, yordam bo‘limiga yozing.`);
    }
  }
  return res;
}
