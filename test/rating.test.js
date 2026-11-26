import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'donat-'));
const { db, rateOrder, gameRatings, unratedOrders } = await import('../src/db.js');
const add = (uid, slug, status) => db.prepare("insert into orders(user_id,game_slug,product_id,player_id,price,status) values(?,?,1,'1',1000,?)").run(uid, slug, status).lastInsertRowid;

test('yetkazilgan buyurtmani 1–5 yulduz bilan baholash mumkin', () => {
  const id = add(1, 'pubg', 'delivered');
  assert.equal(unratedOrders(1).length, 1);
  assert.equal(rateOrder(1, id, 4), 4);
  assert.equal(unratedOrders(1).length, 0);
});
test('6 yulduz yoki 0 qabul qilinmaydi', () => {
  const id = add(1, 'pubg', 'delivered');
  assert.throws(() => rateOrder(1, id, 6));
  assert.throws(() => rateOrder(1, id, 0));
});
test('boshqaning buyurtmasini baholab bo‘lmaydi', () => {
  const id = add(2, 'pubg', 'delivered');
  assert.throws(() => rateOrder(1, id, 5));
});
test('yetkazilmagan buyurtmani baholab bo‘lmaydi', () => {
  const id = add(1, 'pubg', 'refunded');
  assert.throws(() => rateOrder(1, id, 5));
});
test('o‘yin reytingi — baholar o‘rtachasi', () => {
  const a = add(3, 'ff', 'delivered'); const b = add(3, 'ff', 'delivered');
  rateOrder(3, a, 5); rateOrder(3, b, 4);
  assert.equal(gameRatings().ff, 4.5);
});
