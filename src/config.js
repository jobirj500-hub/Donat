const publicUrl =
  process.env.PUBLIC_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '');

export const env = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  ADMIN_IDS: (process.env.ADMIN_ID || '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter(Boolean),
  D24_API_KEY: process.env.D24_API_KEY || '',
  PORT: Number(process.env.PORT || 3000),
  PUBLIC_URL: publicUrl.replace(/\/$/, ''),
  DATA_DIR: process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data',
  // Faqat lokal sinov uchun: initData'siz shu ID bilan kirish. Railway'da qo'ymang.
  DEV_AUTH_USER: process.env.DEV_AUTH_USER ? Number(process.env.DEV_AUTH_USER) : null,
  DISABLE_BOT: process.env.DISABLE_BOT === '1',
};

// Admin panelidan o'zgartiriladigan sozlamalar (standart qiymatlar)
export const DEFAULT_SETTINGS = {
  shop_name: 'Donat',
  markup: '10',
  min_topup: '5000',
  max_topup: '10000000',
  card_number: '',
  card_holder: '',
  card_bank: '',
  channel_url: '',
  support_url: '',
  welcome_text: 'Xush kelibsiz, {name}! 👋\nO‘yinlarga tez va xavfsiz donat qilish uchun «Xaridni boshlash» tugmasini bosing.',
  banner_title: 'O‘yinlarga donat — rasmiy va tezkor',
  banner_subtitle: 'Tez yetkazish • 100% xavfsiz • 24/7 yordam',
  welcome_photo: '',
  shop_open: '1',
  ref_bonus: '0',
};

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

export const isAdmin = (id) => env.ADMIN_IDS.includes(Number(id));
