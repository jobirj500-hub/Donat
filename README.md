# Donat — Telegram bot + Mini App (Donat24 API)

PayerPin uslubidagi o‘yinlarga donat do‘koni:

- **Bot**: `/start` — rasm, salom va «🛒 Xaridni boshlash» (Mini App), kanal va yordam tugmalari.
- **Mini App**: barcha o‘yinlar (rasmlari bilan), paketlar (paket rasmlari bilan), balans, to‘ldirish (karta + chek), buyurtmalar, tranzaksiyalar, promokod, do‘st taklifi, eng yaxshi donorlar.
- **Admin panel** (Mini App ichida, faqat `ADMIN_ID` uchun): statistika va Donat24 balansi, to‘lovlarni tasdiqlash/rad etish, buyurtmalar, foydalanuvchilar (balans +/-, blok), o‘yinlar (yashirish, top, alohida ustama %), promokodlar, sozlamalar (ustama, karta, havolalar, matnlar, do‘kon ochiq/yopiq), hammaga xabar.
- Chek rasmlari adminga botda ✅/❌ tugmalari bilan keladi.
- Buyurtma Donat24 ga yuboriladi; bajarilmasa pul mijoz balansiga avtomatik qaytadi.

## Railway o‘zgaruvchilari

| Nomi | Qiymat |
|---|---|
| `BOT_TOKEN` | BotFather tokeni |
| `ADMIN_ID` | Admin Telegram ID (bir nechta bo‘lsa vergul bilan) |
| `D24_API_KEY` | Donat24 API kaliti (`d24_…`) |
| `DATA_DIR` | `/data` (Railway volume) |
| `PUBLIC_URL` | ixtiyoriy — bo‘lmasa `RAILWAY_PUBLIC_DOMAIN` ishlatiladi |
| `HAMYON_SHOP_ID` | HamyonAPI do‘kon ID (@HamyonAPIBot beradi) — avto to‘lov uchun |
| `HAMYON_SHOP_KEY` | HamyonAPI maxfiy kaliti (`sk_…`) — faqat serverda |

Ma’lumotlar SQLite faylida (`$DATA_DIR/shop.db`) saqlanadi — Railway’da `/data` ga volume ulang.

## ⚡ Avto to‘lov (HamyonAPI)

Mijoz summani kiritadi → bot karta raqami va aniq summani ko‘rsatadi → pul HUMO/UZCARD kartaga tushishi bilan (5–30 soniya) balans o‘zi to‘ldiriladi. Chek kerak emas.

1. Telegram’da [@HamyonAPIBot](https://t.me/HamyonAPIBot) → `/start` → `shop_id` va `shop_key` oling.
2. Kartangizni ulang: HUMO — @HumoCardBot, UZCARD — @CardXabarBot.
3. Railway → Variables: `HAMYON_SHOP_ID` va `HAMYON_SHOP_KEY` qo‘shing.
4. @HamyonAPIBot do‘kon sozlamalarida:
   - `prepare_url` = `https://<domen>/hamyon/prepare`
   - `complete_url` = `https://<domen>/hamyon/complete`
   (aniq manzillar Mini App → Admin → Sozlamalar → «Avto to‘lov» bo‘limida ko‘rinadi)

Xavfsizlik: har bir callback `md5(shop_id + payment_id + amount + shop_key)` imzosi bilan tekshiriladi, summa bazadan olinadi, takroriy callback balansni ikki marta to‘ldirmaydi. Bir xil summada ochiq to‘lov bo‘lsa, summa 1 so‘mga oshiriladi (50 000 → 50 001). Callback yetib bormasa, server holatni har 2 daqiqada o‘zi tekshiradi.

Admin panelda avto to‘lovni o‘chirib qo‘yish mumkin; karta + chek usuli zaxira sifatida qoladi.

## Lokal ishga tushirish

```bash
npm install
BOT_TOKEN=... ADMIN_ID=... D24_API_KEY=... npm start
npm test
```
