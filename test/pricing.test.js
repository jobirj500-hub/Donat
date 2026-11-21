import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sellPrice, effectiveMarkup, finalPrice } from '../src/pricing.js';

test('10% ustama qo‘shiladi', () => assert.equal(sellPrice(10000, 10), 11000));
test('0% ustamada narx o‘zgarmaydi', () => assert.equal(sellPrice(11800, 0), 11800));
test('100 so‘mgacha yuqoriga yaxlitlanadi', () => assert.equal(sellPrice(12201.3, 0), 12300));
test('o‘yin ustamasi umumiy ustamadan ustun', () => assert.equal(effectiveMarkup(10, 5), 5));
test('o‘yin ustamasi bo‘lmasa umumiy ustama', () => assert.equal(effectiveMarkup(10, null), 10));
test('paketga qo‘lda narx qo‘yilsa o‘sha narx sotiladi', () => assert.equal(finalPrice(10000, 10, 15000), 15000));
test('qo‘lda narx bo‘lmasa ustama bo‘yicha', () => assert.equal(finalPrice(10000, 10, null), 11000));
