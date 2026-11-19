import crypto from 'node:crypto';

// HamyonAPI callback imzosi: md5(shop_id + payment_id + amount + shop_key)
export const hamyonSign = (shopId, paymentId, amount, shopKey) =>
  crypto.createHash('md5').update(`${shopId}${paymentId}${amount}${shopKey}`).digest('hex');

export function verifyHamyonSign(f, shopId, shopKey) {
  if (!f || !shopId || !shopKey) return false;
  const calc = hamyonSign(shopId, f.payment_id ?? '', f.amount ?? '', shopKey);
  const got = String(f.sign || '').toLowerCase();
  return got.length === calc.length && crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(got));
}

// "Bu summada ochiq to'lov mavjud" xatosi
export const isAmountBusyError = (msg) => /ochiq\s+to.?lov/i.test(String(msg || ''));

// Bir do'konda bir xil summadagi ikkita ochiq to'lov bo'lolmaydi —
// band bo'lsa summa 1 so'mdan oshirib boriladi (50000 -> 50001)
export function freeAmount(amount, busy, maxStep = 50) {
  for (let i = 0; i <= maxStep; i++) if (!busy.has(amount + i)) return amount + i;
  return null;
}

// "T123" -> 123
export const topupIdFromOrder = (orderId) => {
  const m = /^T(\d+)$/.exec(String(orderId || ''));
  return m ? Number(m[1]) : null;
};
