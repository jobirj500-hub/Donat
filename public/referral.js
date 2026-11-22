// Do'st taklifi shartlari — Mini App va testlar shu bitta manbadan foydalanadi.
const fmt = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/[\s,]/g, ' ')} so‘m`;

export function referralTerms(settings = {}, stats = {}) {
  const bonus = Math.max(0, Math.round(Number(settings.ref_bonus) || 0));
  const minTopup = Math.max(0, Math.round(Number(settings.min_topup) || 0));
  const active = bonus > 0;
  return {
    active,
    bonus,
    bonusText: active ? fmt(bonus) : 'Hozircha yo‘q',
    headline: active ? `Har bir do‘st uchun ${fmt(bonus)}` : 'Bonus hozircha berilmaydi',
    steps: [
      'Havolangizni do‘stingizga yuboring.',
      'Do‘stingiz botni shu havola orqali birinchi marta ochib, START tugmasini bosadi.',
      `Do‘stingiz balansini birinchi marta to‘ldiradi${minTopup ? ` (kamida ${fmt(minTopup)})` : ''} va to‘lov tasdiqlanadi.`,
      active ? `Shundan so‘ng balansingizga ${fmt(bonus)} avtomatik qo‘shiladi.` : 'Bonus yoqilganda miqdori shu yerda ko‘rsatiladi.',
    ],
    rules: [
      'Bonus har bir do‘st uchun faqat bir marta, uning birinchi to‘ldiruvida beriladi.',
      'Botdan avval foydalangan odamlar va o‘zingizni taklif qilish hisobga olinmaydi.',
      'Bonus miqdori do‘stingiz qancha to‘ldirishiga bog‘liq emas.',
      'Bonus balansga tushadi va faqat xizmatlarni sotib olishga ishlatiladi.',
    ],
    invited: Number(stats.refs) || 0,
    paid: Number(stats.ref_paid) || 0,
    earnedText: fmt(stats.ref_earned),
  };
}
