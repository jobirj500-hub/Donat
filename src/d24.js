// Donat24 Reseller API mijoz: https://donat24.uz/api
import { env } from './config.js';
import { deadline } from './telegram.js';

const BASE = 'https://donat24.uz/api/v1';
export const SITE = 'https://donat24.uz';

export class D24Error extends Error {
  constructor(message, { status = 0, code = null, network = false } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.network = network;
  }
}

async function call(p, { method = 'GET', body } = {}) {
  let res, json = null;
  try {
    res = await deadline(fetch(BASE + p, {
      method,
      headers: {
        'X-API-Key': env.D24_API_KEY,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(25000),
    }), 30000, 'd24');
  } catch (e) {
    throw new D24Error('Donat24 bilan aloqa uzildi', { network: true });
  }
  try {
    json = await deadline(res.json(), 15000, 'd24 body');
  } catch {}
  if (!res.ok || !json || json.success === false) {
    throw new D24Error(json?.message || `Donat24 xatosi (${res.status})`, {
      status: res.status,
      code: json?.error || null,
    });
  }
  return json.data;
}

export const abs = (u) => (!u ? null : u.startsWith('http') ? u : SITE + (u.startsWith('/') ? '' : '/') + u);
const enc = encodeURIComponent;

const cache = new Map();
async function cached(key, ttlMs, fn) {
  const c = cache.get(key);
  if (c && c.exp > Date.now()) return c.val;
  try {
    const val = await fn();
    cache.set(key, { val, exp: Date.now() + ttlMs });
    return val;
  } catch (e) {
    if (c) return c.val; // eski nusxa bo'lsa o'shani beramiz
    throw e;
  }
}
export const clearCache = () => cache.clear();

export const me = () => call('/me');

export const games = () =>
  cached('games', 10 * 60e3, async () =>
    (await call('/games')).games.map((g) => ({ ...g, image_url: abs(g.image_url) })),
  );

export const game = (slug) =>
  cached('game:' + slug, 3 * 60e3, async () => {
    const d = await call('/games/' + enc(slug));
    return { game: { ...d.game, image_url: abs(d.game.image_url) }, products: d.products || [] };
  });

export const product = async (slug, id) =>
  (await call(`/games/${enc(slug)}/products/${Number(id)}`)).product;

// Paket rasmlari API'da yo'q — Donat24 o'yin sahifasidan olinadi (6 soat kesh)
export const productImages = (slug) =>
  cached('img:' + slug, 6 * 3600e3, async () => {
    const map = {};
    try {
      const r = await deadline(fetch(`${SITE}/game/${enc(slug)}`, { signal: AbortSignal.timeout(15000) }), 20000, 'img');
      if (!r.ok) return map;
      const html = await deadline(r.text(), 15000, 'img body');
      for (const chunk of html.split('class="gx-pkg"').slice(1)) {
        const id = chunk.match(/name="package_id"\s+value="(\d+)"/)?.[1];
        const img = chunk.match(/class="gx-pkg-ic"[^>]*>\s*<img[^>]*src="([^"]+)"/)?.[1];
        if (id && img) map[id] = abs(img);
      }
    } catch {}
    return map;
  });

export const validatePlayer = (slug, player_id, server_id) =>
  call(`/games/${enc(slug)}/validate-player`, {
    method: 'POST',
    body: { player_id, ...(server_id ? { server_id } : {}) },
  });

export const createOrder = (slug, body) =>
  call(`/games/${enc(slug)}/order`, { method: 'POST', body });

export const orderStatus = async (orderId) => (await call(`/orders/${enc(orderId)}`)).order;
