import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hamyonSign, verifyHamyonSign, isAmountBusyError, freeAmount, topupIdFromOrder } from '../src/hamyon-util.js';

const f = (extra = {}) => ({ payment_id: 'a1b2c3d4e5f6', amount: '50000', status: 'paid', ...extra });

test('imzo md5(shop_id + payment_id + amount + shop_key) bo‘yicha hisoblanadi', () => {
  assert.equal(hamyonSign('12', 'a1b2c3d4e5f6', '50000', 'sk_test'), 'dc84bbd6b585d56b3a32978616364ea7');
});
test('to‘g‘ri imzo qabul qilinadi', () => {
  const sign = hamyonSign('12', 'a1b2c3d4e5f6', '50000', 'sk_test');
  assert.equal(verifyHamyonSign(f({ sign }), '12', 'sk_test'), true);
});
test('summa o‘zgartirilgan callback rad etiladi', () => {
  const sign = hamyonSign('12', 'a1b2c3d4e5f6', '50000', 'sk_test');
  assert.equal(verifyHamyonSign(f({ sign, amount: '500000' }), '12', 'sk_test'), false);
});
test('boshqa kalit bilan imzolangan callback rad etiladi', () => {
  const sign = hamyonSign('12', 'a1b2c3d4e5f6', '50000', 'sk_other');
  assert.equal(verifyHamyonSign(f({ sign }), '12', 'sk_test'), false);
});
test('imzosiz callback rad etiladi', () => assert.equal(verifyHamyonSign(f(), '12', 'sk_test'), false));
test('band summa 1 so‘mga oshiriladi', () => assert.equal(freeAmount(50000, new Set([50000])), 50001));
test('bo‘sh summa o‘zgarmaydi', () => assert.equal(freeAmount(50000, new Set([49999])), 50000));
test('ketma-ket band summalar o‘tkazib yuboriladi', () => assert.equal(freeAmount(50000, new Set([50000, 50001, 50002])), 50003));
test('“ochiq to‘lov mavjud” xatosi taniladi', () => assert.equal(isAmountBusyError("Bu summada ochiq to'lov mavjud"), true));
test('boshqa xato band summa deb hisoblanmaydi', () => assert.equal(isAmountBusyError("Do'kon topilmadi!"), false));
test('order_id dan to‘lov raqami olinadi', () => assert.equal(topupIdFromOrder('T42'), 42));
test('begona order_id e’tiborsiz qoldiriladi', () => assert.equal(topupIdFromOrder('ORD-1'), null));
