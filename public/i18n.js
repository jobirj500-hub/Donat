// Mini App tili (UZ / RU). Sahifalar o'zbekcha yoziladi, RU tanlansa matnlar shu lug'at bo'yicha almashtiriladi.
// API'dan kelgan nomlar (o'yin, paket, foydalanuvchi) hech qachon o'zgartirilmaydi.
const KEY = 'donat_lang';
export const lang = (() => { try { return localStorage.getItem(KEY) === 'ru' ? 'ru' : 'uz'; } catch { return 'uz'; } })();
export function setLang(l) { try { localStorage.setItem(KEY, l); } catch {} location.reload(); }

const SKIP = '.pn, .g > span, .hero h1, .hello b, .profile h2, [data-raw], code, textarea, script, style, #ap';

const D = {
  'Asosiy': 'Главная', 'O‘yinlar': 'Игры', 'To‘ldirish': 'Пополнить', 'Buyurtmalar': 'Заказы', 'Profil': 'Профиль', 'Admin': 'Админ',
  'Salom 👋': 'Привет 👋', 'Balans': 'Баланс', 'Promokodlar': 'Промокоды', '🎟️ Promokodlar': '🎟️ Промокоды', 'Yordam': 'Поддержка',
  '⚠️ Do‘kon vaqtincha yopiq. Tez orada qaytamiz!': '⚠️ Магазин временно закрыт. Скоро вернёмся!',
  'Balansni to‘ldir, qulay narx': 'Пополни баланс — выгодные цены', 'Karta orqali tez to‘ldirish': 'Быстрое пополнение картой',
  'Do‘stingni taklif qil — bonus ol': 'Пригласи друга — получи бонус',
  'Havolangiz orqali kelgan do‘st birinchi marta to‘ldirsa, bonus sizga': 'Друг по вашей ссылке впервые пополнит баланс — бонус ваш',
  'Taklif qilish': 'Пригласить', 'Eng yaxshi donorlar': 'Лучшие донаторы', 'Ko‘p donat qiling — top 100 talikka kiring': 'Донатьте больше — попадите в топ-100',
  'Ko‘rish': 'Смотреть', 'Ommabop o‘yinlar': 'Популярные игры', 'Barchasi': 'Все', 'Qidiruv natijasi': 'Результаты поиска', 'Barcha xizmatlar': 'Все сервисы',
  'Eng yaxshi 100 talik': 'Топ-100 лучших', 'Top': 'Топ',
  'O‘yinni qidiring: pubg, ff, mlbb, stars…': 'Найти игру: pubg, ff, mlbb, stars…', 'O‘yin yoki xizmat: pubg, ff, mlbb, stars…': 'Игра или сервис: pubg, ff, mlbb, stars…',
  'Paketni qidiring: 60, 660 uc…': 'Найти пакет: 60, 660 uc…', 'Paketni qidiring': 'Найти пакет',
  'Barcha o‘yinlar': 'Все игры', '⭐ Ommabop': '⭐ Популярные', 'Topilmadi': 'Не найдено',
  'Boshqacha yozib ko‘ring: masalan «pubg», «ff», «mlbb»': 'Попробуйте иначе: например «pubg», «ff», «mlbb»',
  'Paketni tanlang': 'Выберите пакет', 'Bunday paket topilmadi': 'Такой пакет не найден', 'Paketlar yo‘q': 'Пакетов нет',
  'Bu o‘yin uchun hozircha paket mavjud emas': 'Для этой игры пока нет пакетов',
  'O‘yinchi ID': 'ID игрока', 'Masalan: 5123456789': 'Например: 5123456789', 'Tekshirish': 'Проверить', 'Masalan: 1234': 'Например: 1234',
  'ID ni diqqat bilan kiriting — noto‘g‘ri ID ga yuborilgan buyurtma qaytarilmaydi.': 'Вводите ID внимательно — заказ на неверный ID не возвращается.',
  'Narx': 'Цена', 'Balansingiz': 'Ваш баланс', 'Tekshirilmoqda…': 'Проверяем…', 'Yuborilmoqda…': 'Отправляем…',
  'ℹ️ Bu o‘yin uchun ID oldindan tekshirilmaydi. Diqqat bilan kiriting.': 'ℹ️ Для этой игры ID заранее не проверяется. Вводите внимательно.',
  '✅ Topildi': '✅ Найдено', '✅ Topildi:': '✅ Найдено:', 'ID topilmadi': 'ID не найден',
  'ID ni kiriting': 'Введите ID', 'Server ID ni kiriting': 'Введите Server ID', 'Balans yetarli emas': 'Недостаточно средств',
  'Buyurtma bajarilmadi, pul qaytarildi': 'Заказ не выполнен, деньги возвращены', '✅ Buyurtma qabul qilindi!': '✅ Заказ принят!',
  'Balansni to‘ldirish': 'Пополнение баланса', '1. Kartaga o‘tkazing': '1. Переведите на карту', 'Karta raqami': 'Номер карты', '📋 Nusxa': '📋 Копировать',
  'Istalgan bittasiga o‘tkazing.': 'Переведите на любую из них.', 'Karta raqami hali sozlanmagan. Admin bilan bog‘laning.': 'Номер карты ещё не настроен. Свяжитесь с админом.',
  '2. Summa va chek': '2. Сумма и чек', 'O‘tkazgan summangiz (so‘m)': 'Переведённая сумма (сум)', 'To‘lov cheki (skrinshot)': 'Чек оплаты (скриншот)',
  'Rasm tanlash uchun bosing': 'Нажмите, чтобы выбрать фото', 'Boshqa rasm tanlash': 'Выбрать другое фото', 'Yuborish': 'Отправить',
  'Admin chekni tekshirib, balansingizni to‘ldiradi. Odatda 5–30 daqiqa.': 'Админ проверит чек и пополнит баланс. Обычно 5–30 минут.',
  'So‘rovlarim': 'Мои заявки', 'Hali so‘rov yo‘q': 'Заявок пока нет', 'Nusxalandi': 'Скопировано', 'Chek rasmini yuklang': 'Загрузите фото чека',
  '✅ So‘rov yuborildi! Tekshirilmoqda': '✅ Заявка отправлена! Проверяем',
  'Yuborilmoqda': 'Отправляется', 'Yetkazilmoqda': 'Доставляется', 'To‘landi': 'Оплачено', 'Yetkazildi': 'Доставлено', 'Bajarilmadi': 'Не выполнено', 'Qaytarildi': 'Возвращено',
  'Tekshirilmoqda': 'Проверяется', 'Tasdiqlandi': 'Подтверждено', 'Rad etildi': 'Отклонено',
  'Balans to‘ldirildi': 'Баланс пополнен', 'Xarid': 'Покупка', 'Promokod': 'Промокод', 'Taklif bonusi': 'Бонус за друга',
  'Tranzaksiyalar': 'Транзакции', 'Buyurtmalar yo‘q': 'Заказов нет', 'Birinchi buyurtma shu yerda ko‘rinadi': 'Здесь появится ваш первый заказ', 'Tranzaksiyalar yo‘q': 'Транзакций нет',
  '＋ To‘ldirish': '＋ Пополнить', 'PROMOKODNI KIRITING': 'ВВЕДИТЕ ПРОМОКОД', 'Faollashtirish': 'Активировать', 'Do‘st taklif qiling': 'Пригласите друга',
  'Bonus hozircha berilmaydi': 'Бонус пока не начисляется', 'Bonus miqdori': 'Размер бонуса', 'Hozircha yo‘q': 'Пока нет',
  'Do‘stingizning birinchi to‘ldiruvidan so‘ng': 'После первого пополнения друга', 'Admin bonusni yoqqanda paydo bo‘ladi': 'Появится, когда админ включит бонус',
  'Bonus olish shartlari': 'Условия получения бонуса', 'Havolangizni do‘stingizga yuboring.': 'Отправьте другу свою ссылку.',
  'Do‘stingiz botni shu havola orqali birinchi marta ochib, START tugmasini bosadi.': 'Друг впервые открывает бота по этой ссылке и нажимает START.',
  'Bonus yoqilganda miqdori shu yerda ko‘rsatiladi.': 'Когда бонус включат, его размер появится здесь.',
  'Bonus har bir do‘st uchun faqat bir marta, uning birinchi to‘ldiruvida beriladi.': 'Бонус начисляется за каждого друга один раз — при его первом пополнении.',
  'Botdan avval foydalangan odamlar va o‘zingizni taklif qilish hisobga olinmaydi.': 'Люди, уже пользовавшиеся ботом, и приглашение самого себя не учитываются.',
  'Bonus miqdori do‘stingiz qancha to‘ldirishiga bog‘liq emas.': 'Размер бонуса не зависит от суммы пополнения друга.',
  'Bonus balansga tushadi va faqat xizmatlarni sotib olishga ishlatiladi.': 'Бонус зачисляется на баланс и тратится только на покупки.',
  'Taklif qilingan': 'Приглашено', 'Bonus berilgan': 'Бонусов выдано', 'Jami bonus': 'Всего бонусов', 'Havolani ulashish': 'Поделиться ссылкой', 'Nusxalash': 'Копировать',
  'Yordam markazi': 'Центр поддержки', 'Bizning kanal': 'Наш канал', 'Tez-tez beriladigan savollar': 'Частые вопросы',
  'To‘lov qildim, lekin balansimga tushmadi': 'Я оплатил, но деньги не пришли на баланс',
  'Chek yuborganingizdan so‘ng admin uni tekshiradi. Odatda 5–30 daqiqa ichida balansingiz to‘ldiriladi. Kechiksa, Yordam bo‘limiga yozing.': 'После отправки чека админ его проверит. Обычно баланс пополняется за 5–30 минут. Если задерживается — напишите в поддержку.',
  'Buyurtmam o‘yinga tushmadi. Qancha kutaman?': 'Заказ не пришёл в игру. Сколько ждать?',
  'Ko‘pincha 1–5 daqiqa. Ba’zi o‘yinlarda biroz ko‘proq vaqt ketishi mumkin. Bajarilmasa pul avtomatik balansingizga qaytadi.': 'Обычно 1–5 минут, в некоторых играх чуть дольше. Если заказ не выполнится, деньги автоматически вернутся на баланс.',
  'O‘yin ID sini xato kiritsam nima bo‘ladi?': 'Что будет, если я ошибусь в ID?',
  'Noto‘g‘ri ID ga yetkazilgan buyurtma qaytarilmaydi. Shuning uchun «Tekshirish» tugmasidan foydalaning.': 'Заказ, доставленный на неверный ID, не возвращается. Поэтому пользуйтесь кнопкой «Проверить».',
  'Balansdagi pulni naqd qilib olsam bo‘ladimi?': 'Можно ли вывести деньги с баланса?', 'Balans faqat xizmatlarni sotib olish uchun ishlatiladi.': 'Баланс используется только для покупок.',
  'Bot orqali oching': 'Откройте через бота', 'Havola nusxalandi': 'Ссылка скопирована', 'Promokodni kiriting': 'Введите промокод', 'Havola hali sozlanmagan': 'Ссылка ещё не настроена',
  'Hali ro‘yxat bo‘sh': 'Список пока пуст', 'Birinchi bo‘ling!': 'Будьте первым!', 'Yuklab bo‘lmadi': 'Не удалось загрузить', 'Qayta urinish': 'Повторить',
  'Telegram orqali oching': 'Откройте через Telegram', 'Xatolik': 'Ошибка', 'Xatolik yuz berdi': 'Произошла ошибка', 'Hisobingiz bloklangan': 'Ваш аккаунт заблокирован',
  'Balansda mablag‘ yetarli emas': 'Недостаточно средств на балансе',
  'Buyurtmangizni baholang': 'Оцените заказ', 'Rahmat! Bahoingiz qabul qilindi': 'Спасибо! Оценка принята', 'Bahongiz': 'Ваша оценка',
};
const R = [
  [/^«(.+)» bo‘yicha (\d+) ta topildi$/, (m) => `«${m[1]}»: найдено ${m[2]}`],
  [/^(\d+) ta o‘yin va xizmat$/, (m) => `${m[1]} игр и сервисов`],
  [/^Sotib olish — (.+)$/, (m) => `Купить — ${som(m[1])}`],
  [/^Eng kam: (.+)$/, (m) => `Минимум: ${m[1]}`],
  [/^Eng kam summa: (.+)$/, (m) => `Минимальная сумма: ${som(m[1])}`],
  [/^Har bir do‘st uchun (.+)$/, (m) => `За каждого друга ${som(m[1])}`],
  [/^Do‘stingiz balansini birinchi marta to‘ldiradi(?: \(kamida (.+)\))? va to‘lov tasdiqlanadi\.$/, (m) => `Друг впервые пополняет баланс${m[1] ? ` (минимум ${som(m[1])})` : ''}, и оплата подтверждается.`],
  [/^Shundan so‘ng balansingizga (.+) avtomatik qo‘shiladi\.$/, (m) => `После этого вам автоматически начислится ${som(m[1])}.`],
  [/^(.+) · Donat24 hamkori$/, (m) => `${m[1]} · партнёр Donat24`],
];
const som = (s) => s.replace(/so‘m/g, 'сум');

export function tr(text) {
  const t = text.trim(); if (!t) return text;
  let out = D[t];
  if (out === undefined) for (const [rx, fn] of R) { const m = t.match(rx); if (m) { out = fn(m); break; } }
  if (out === undefined) out = som(t);
  if (out === t) return text;
  const lead = text.match(/^\s*/)[0]; const tail = text.match(/\s*$/)[0];
  return lead + out + tail;
}

function walk(root) {
  if (root.nodeType === 3) { fix(root); return; }
  if (root.nodeType !== 1) return;
  if (root.closest?.(SKIP)) return;
  for (const a of ['placeholder', 'aria-label']) if (root.hasAttribute?.(a)) { const v = tr(root.getAttribute(a)); if (v !== root.getAttribute(a)) root.setAttribute(a, v); }
  for (const c of root.childNodes) walk(c);
}
function fix(node) {
  const p = node.parentElement; if (!p || p.closest(SKIP)) return;
  const v = tr(node.data); if (v !== node.data) node.data = v;
}

export function startI18n() {
  document.documentElement.lang = lang;
  if (lang !== 'ru') return;
  walk(document.body);
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') fix(m.target);
      else m.addedNodes.forEach(walk);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
