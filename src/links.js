// Admin kiritgan havolani Telegram qabul qiladigan URL ga aylantiradi.
// "Yordam markazi. @saidov_savdo" -> "https://t.me/saidov_savdo"
// Noto'g'ri havola bo'lsa '' qaytadi (tugma ko'rsatilmaydi, /start buzilmaydi).
export function normalizeLink(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  const url = /https?:\/\/[^\s<>"']+/i.exec(s);
  if (url) return url[0];
  const tme = /(?:^|\s)((?:t\.me|telegram\.me)\/[A-Za-z0-9_+\/-]+)/i.exec(s);
  if (tme) return 'https://' + tme[1];
  const at = /@([A-Za-z0-9_]{4,32})\b/.exec(s);
  if (at) return 'https://t.me/' + at[1];
  if (/^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(s)) return 'https://t.me/' + s;
  return '';
}

export const LINK_KEYS = ['channel_url', 'support_url'];
