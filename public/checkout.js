export function topupNeeded(price, balance, min, max) {
  const deficit = Math.max(0, Math.ceil(Number(price) - Number(balance)));
  return Math.min(Number(max), Math.max(Number(min), deficit));
}
export function validDraft(d, userId, now = Date.now()) {
  return !!(d && d.user_id === userId && d.game?.slug && Number.isSafeInteger(d.p?.id) && d.player_id && d.request_key && Number.isFinite(d.p.price) && d.p.price > 0 && Number.isFinite(d.createdAt) && now >= d.createdAt && now - d.createdAt < 3600000);
}
export function canResume(d, balance, userId, now = Date.now()) {
  return validDraft(d, userId, now) && Number(balance) >= d.p.price;
}
export function orderBody(d) {
  return {slug:d.game.slug, product_id:d.p.id, player_id:d.player_id, server_id:d.server_id || undefined, request_key:d.request_key, max_price:d.p.price};
}
