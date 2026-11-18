import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sellPrice, effectiveMarkup } from '../src/pricing.js';

test('10% ustama qo‘shiladi', () => assert.equal(sellPrice(10000, 10), 11000));
test('0% ustamada narx o‘zgarmaydi', () => assert.equal(sellPrice(11800, 0), 11800));
test('100 so‘mgacha yuqoriga yaxlitlanadi', () => assert.equal(sellPrice(12201.3, 0), 12300));
test('o‘yin ustamasi umumiy ustamadan ustun', () => assert.equal(effectiveMarkup(10, 5), 5));
test('o‘yin ustamasi bo‘lmasa umumiy ustama', () => assert.equal(effectiveMarkup(10, null), 10));
