import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchGames, searchProducts } from '../public/search.js';

const games = [
  { slug: 'pubg-mobile-auto', name: 'PUBG Mobile' },
  { slug: 'free-fire-cis', name: 'Free Fire (CIS)' },
  { slug: 'mobile-legends-global', name: 'Mobile Legends Global' },
  { slug: 'telegram-stars', name: 'Telegram Stars' },
  { slug: 'honor-of-kings', name: 'Honor of Kings' },
  { slug: 'call-of-duty-mobile', name: 'Call of Duty Mobile' },
];
const names = (q) => searchGames(games, q).map((g) => g.slug);

test('katta-kichik harf farqi yo‘q', () => assert.equal(names('pubg')[0], 'pubg-mobile-auto'));
test('kirillcha yozilsa ham topadi', () => assert.equal(names('пубг')[0], 'pubg-mobile-auto'));
test('ff → Free Fire', () => assert.equal(names('ff')[0], 'free-fire-cis'));
test('mlbb → Mobile Legends', () => assert.equal(names('mlbb')[0], 'mobile-legends-global'));
test('stars → Telegram Stars', () => assert.equal(names('stars')[0], 'telegram-stars'));
test('hok → Honor of Kings', () => assert.equal(names('hok')[0], 'honor-of-kings'));
test('cod → Call of Duty', () => assert.equal(names('cod')[0], 'call-of-duty-mobile'));
test('bo‘shliqsiz yozilsa ham: freefire', () => assert.equal(names('freefire')[0], 'free-fire-cis'));
test('mos kelmasa bo‘sh', () => assert.deepEqual(names('zzzqqq'), []));
test('paketlar raqam bo‘yicha', () =>
  assert.deepEqual(searchProducts([{ name: '60 UC' }, { name: '660 UC' }, { name: 'Prime' }], '660').map((p) => p.name), ['660 UC']));
