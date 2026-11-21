// Sotuv narxi: Donat24 narxi + ustama (%), 100 so'mgacha yuqoriga yaxlitlanadi.
export function sellPrice(cost, markupPct) {
  const c = Number(cost) || 0;
  const m = Number(markupPct);
  const pct = Number.isFinite(m) && m > -100 ? m : 0;
  const raw = c * (1 + pct / 100);
  return Math.ceil(Math.round(raw * 100) / 100 / 100) * 100;
}

// O'yin uchun alohida ustama bo'lsa o'sha, bo'lmasa umumiy ustama
export function effectiveMarkup(globalMarkup, gameMarkup) {
  if (gameMarkup !== null && gameMarkup !== undefined && gameMarkup !== '') return Number(gameMarkup);
  return Number(globalMarkup) || 0;
}

// Admin paketga qo'lda narx qo'ygan bo'lsa o'sha, bo'lmasa ustama bo'yicha
export function finalPrice(cost, markupPct, fixed) {
  const f = Math.round(Number(fixed));
  if (fixed !== null && fixed !== undefined && fixed !== '' && Number.isFinite(f) && f > 0) return f;
  return sellPrice(cost, markupPct);
}
