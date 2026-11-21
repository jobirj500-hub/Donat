// Qulay qidiruv: katta-kichik harf, bo'shliq, kirill/lotin va qisqartmalarni farqlamaydi
const CYR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h' };

export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[а-яёўқғҳ]/g, (c) => CYR[c] ?? c)
    .replace(/[‘’ʻʼ`'"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Odamlar ko'p yozadigan qisqa nomlar → o'yin nomidagi so'z
const ALIASES = {
  pubg: ['pubg'], pabg: ['pubg'], pubj: ['pubg'], pupg: ['pubg'], uc: ['pubg'],
  ff: ['free fire'], free: ['free fire'], fri: ['free fire'], fayr: ['free fire'], almaz: ['free fire', 'mobile legends'], olmos: ['free fire', 'mobile legends'],
  ml: ['mobile legends'], mlbb: ['mobile legends'], mobayl: ['mobile legends'], mobile: ['mobile legends'], legends: ['mobile legends'],
  cod: ['call of duty'], kod: ['call of duty'],
  stars: ['telegram stars'], star: ['telegram stars'], zvezda: ['telegram stars'], zvezdi: ['telegram stars'], yulduz: ['telegram stars'],
  premium: ['telegram premium'], tg: ['telegram'], telegram: ['telegram'], telegramm: ['telegram'],
  hok: ['honor of kings'], genshin: ['genshin'], pubgm: ['pubg mobile'], standoff: ['standoff'], so2: ['standoff'],
  steam: ['steam'], roblox: ['roblox'], robloks: ['roblox'], brawl: ['brawl'], bravl: ['brawl'], clash: ['clash'],
};

function score(name, slug, q) {
  const n = norm(name);
  const flat = n.replace(/ /g, '');
  const sl = norm(slug);
  const qf = q.replace(/ /g, '');
  if (n === q || flat === qf) return 100;
  if (n.startsWith(q) || flat.startsWith(qf)) return 80;
  if (n.split(' ').some((w) => w.startsWith(q))) return 70;
  if (flat.includes(qf) || sl.replace(/ /g, '').includes(qf)) return 60;
  // Har bir so'z (istalgan tartibda)
  const words = q.split(' ').filter(Boolean);
  if (words.length > 1 && words.every((w) => n.includes(w) || sl.includes(w))) return 50;
  // Qisqartma: "mlbb", "cod" va h.k.
  const al = words.flatMap((w) => ALIASES[w] || []);
  if (al.some((a) => n.includes(a) || sl.includes(a.replace(/ /g, ' ')))) return 45;
  // Bosh harflar: "hok" → Honor of Kings
  const initials = n.split(' ').map((w) => w[0]).join('');
  if (qf.length >= 2 && initials.startsWith(qf)) return 40;
  return 0;
}

export function searchGames(games, query) {
  const q = norm(query);
  if (!q) return games;
  return games
    .map((g, i) => ({ g, i, s: score(g.name, g.slug, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || (b.g.popular ? 1 : 0) - (a.g.popular ? 1 : 0) || a.i - b.i)
    .map((x) => x.g);
}

// Paketlarni qidirish: "60", "660 uc", "prime"
export function searchProducts(products, query) {
  const q = norm(query);
  if (!q) return products;
  const words = q.split(' ');
  return products.filter((p) => { const n = norm(p.name); return words.every((w) => n.includes(w)); });
}
