import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'donat-order-'));
process.env.D24_API_KEY = 'test-key';
let providerOrders = 0;
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  const data = u.endsWith('/games/free-fire')
    ? { game: { slug: 'free-fire', name: 'Free Fire', available: true, needs_server_id: false }, products: [] }
    : u.endsWith('/products/7')
      ? { product: { id: 7, name: '520 olmos', price_uzs: 27000 } }
      : u.endsWith('/order') && init.method === 'POST'
        ? (providerOrders++, { order: { order_id: 'D24-1', status: 'paid' } })
        : {};
  return new Response(JSON.stringify({ success: true, data }), { status: 200 });
};

const { db, changeBalance, getUser, setSetting } = await import('../src/db.js');
const { placeOrder } = await import('../src/orders.js');
db.prepare('insert into users(id,first_name,balance) values(?,?,?)').run(11, 'Umid', 0);
setSetting('markup', '10');
changeBalance(11, 30000, 'test', 'seed', 'test balance');
const req = { slug: 'free-fire', product_id: 7, player_id: '5123456789', request_key: '11111111-1111-4111-8111-111111111111', max_price: 29700 };

test('the same checkout request creates one order and debits once', async () => {
  const first = await placeOrder(11, req);
  const retry = await placeOrder(11, req);
  assert.equal(retry.id, first.id);
  assert.equal(getUser(11).balance, 300);
  assert.equal(providerOrders, 1);
});

test('a higher current price does not debit the buyer', async () => {
  changeBalance(11, 1000, 'test', 'seed2', 'test balance');
  const higher = { ...req, request_key: '22222222-2222-4222-8222-222222222222', max_price: 29699 };
  await assert.rejects(placeOrder(11, higher), { code: 'price_changed' });
  assert.equal(getUser(11).balance, 1300);
});
