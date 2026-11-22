// Taklif havolasi va nusxalash — Telegram ichidagi brauzerda ham ishlaydi.
export function referralLink(bot, userId) {
  const name = String(bot || '').trim().replace(/^@/, '');
  if (!name || !userId) return '';
  return `https://t.me/${name}?start=ref${userId}`;
}

// 1) zamonaviy clipboard, 2) eski execCommand usuli. Ikkalasi ham bo'lmasa false.
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
    document.body.appendChild(ta);
    ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}
