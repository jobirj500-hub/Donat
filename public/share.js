// Taklif havolasi va nusxalash — Telegram ichidagi brauzerda ham ishlaydi.
export function referralLink(bot, userId) {
  const name = String(bot || '').trim().replace(/^@/, '');
  if (!name || !userId) return '';
  return `https://t.me/${name}?start=ref${userId}`;
}

// Eski usul: yashirin maydonni belgilab "copy" buyrug'i. Bosish bilan bir vaqtda
// (hech qanday kutishsiz) chaqirilishi shart — aks holda Telegram WebView ruxsat bermaydi.
function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.contentEditable = 'true';
  ta.readOnly = false;
  ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px';
  document.body.appendChild(ta);
  let ok = false;
  try {
    ta.focus();
    const range = document.createRange();
    range.selectNodeContents(ta);
    const sel = window.getSelection();
    sel?.removeAllRanges(); sel?.addRange(range);
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand('copy');
  } catch {}
  ta.remove();
  window.getSelection()?.removeAllRanges();
  return ok;
}

// Ikkala usulni ham ishlatadi: eski usul darhol, zamonaviy clipboard esa qo'shimcha.
export async function copyText(text) {
  const legacy = legacyCopy(text);
  let modern = false;
  try {
    if (navigator.clipboard?.writeText) {
      await Promise.race([navigator.clipboard.writeText(text), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))]);
      modern = true;
    }
  } catch {}
  return legacy || modern;
}
