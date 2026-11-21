export const cleanText = s => String(s ?? '').replace(/\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*/gu,'').replace(/[ \t]+\n/g,'\n').replace(/ {2,}/g,' ').trim();
export function cleanPayload(body) {
 const out={...body};for(const k of ['text','caption','description','short_description'])if(typeof out[k]==='string')out[k]=cleanText(out[k]);
 if(out.reply_markup){out.reply_markup={...out.reply_markup};for(const k of ['inline_keyboard','keyboard'])if(out.reply_markup[k])out.reply_markup[k]=out.reply_markup[k].map(row=>row.map(b=>typeof b==='string'?cleanText(b):({...b,text:cleanText(b.text)})));}return out;
}
export const welcome = name => `<b>Xush kelibsiz, ${name}.</b>\n\nFree Fire olmoslari, PUBG UC, Mobile Legends va boshqa o‘yinlar uchun donat.\n\nO‘yinni va paketni tanlang, ID ni kiriting va xaridni tasdiqlang. Buyurtma holatini ilovada kuzatishingiz mumkin.\n\nSavolingiz bo‘lsa, yordam markaziga murojaat qiling.`;
