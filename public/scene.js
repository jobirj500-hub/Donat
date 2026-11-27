// Bo'limlar orqa foni, qizil-pushti palitra va emojilarni rasmga almashtirish.
const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/app/scene.css?v=1'; document.head.append(css);
const bg = document.createElement('div'); bg.className = 'scene-bg'; bg.setAttribute('aria-hidden', 'true'); document.body.prepend(bg);
const SECTIONS = { '': 'home', games: 'games', game: 'games', topup: 'topup', orders: 'orders', profile: 'profile', top: 'profile', admin: 'admin' };
function setScene() {
  const page = ((location.hash || '#/').match(/^#\/([^/]*)/) || [])[1] || '';
  const s = SECTIONS[page] || 'home';
  document.body.dataset.section = s;
  bg.style.backgroundImage = `url(/media/bg/${s}.webp)`;
}
window.addEventListener('hashchange', setScene); setScene();

const art = { '🏠':'diamond','🎮':'diamond','💳':'card','🕒':'wait','👤':'wallet','⚙':'diamond','💰':'wallet','🎟':'promo','🎧':'support','🏆':'trophy','💎':'diamond','📦':'empty','🛍':'empty','🛒':'empty','💸':'wallet','🤝':'gift','🎁':'gift','🎉':'gift','📢':'channel','📣':'channel','⚡':'bolt','✅':'success','⌛':'wait','⏳':'wait','⚠':'alert','⛔':'alert','❌':'alert','🚫':'alert','🧾':'card','📊':'trophy','👥':'gift','👮':'support','👋':'gift','✉':'channel','⭐':'trophy','🥇':'trophy','🥈':'trophy','🥉':'trophy','🚚':'loot','🎨':'diamond' };
const symbols = { '🔍':'⌕','🔎':'⌕','📋':'⧉','📎':'＋','⬇':'↓','⬆':'↑','🔄':'↻','🗑':'×','👁':'◉','💾':'','🔗':'↗','➖':'−' };
const emoji = /\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*/gu;
const keep = new Set(['★', '©', '®', '™', '↗', '↻', '↓', '↑']);
function polish(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  for (const node of nodes) {
    if (node.parentElement?.closest('script,style,textarea,code,input')) continue;
    const text = node.textContent; emoji.lastIndex = 0; if (!emoji.test(text)) continue;
    const f = document.createDocumentFragment(); let at = 0, changed = false;
    for (const m of text.matchAll(emoji)) {
      const base = m[0].replace(/\uFE0F/g, '');
      if (keep.has(base)) continue;
      changed = true; f.append(text.slice(at, m.index));
      if (art[base]) { const im = document.createElement('img'); im.src = '/media/' + art[base] + '.webp'; im.alt = ''; im.className = 'art'; im.width = 22; im.height = 22; f.append(im); }
      else f.append(symbols[base] ?? '');
      at = m.index + m[0].length;
    }
    if (!changed) continue;
    f.append(text.slice(at)); node.replaceWith(f);
  }
  for (const el of root.querySelectorAll?.('input[placeholder],button[title]') || []) { if (el.placeholder) el.placeholder = el.placeholder.replace(emoji, '').trim(); }
}
let q = false;
new MutationObserver(() => { if (q) return; q = true; queueMicrotask(() => { q = false; polish(document.body); }); }).observe(document.body, { childList: true, subtree: true, characterData: true });
polish(document.body);
