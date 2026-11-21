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

Ma’lumotlar SQLite faylida (`$DATA_DIR/shop.db`) saqlanadi — Railway’da `/data` ga volume ulang.

## Lokal ishga tushirish

```bash
npm install
BOT_TOKEN=... ADMIN_ID=... D24_API_KEY=... npm start
npm test
```
