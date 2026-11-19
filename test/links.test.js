import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLink } from '../src/links.js';

test('matn ichidagi @username t.me havolasiga aylanadi', () => assert.equal(normalizeLink('Yordam markazi. @saidov_savdo'), 'https://t.me/saidov_savdo'));
test('yolg‘iz @username t.me havolasiga aylanadi', () => assert.equal(normalizeLink('@saidov_savdo'), 'https://t.me/saidov_savdo'));
test('to‘liq https havola o‘zgarmaydi', () => assert.equal(normalizeLink('https://t.me/kanal'), 'https://t.me/kanal'));
test('t.me/... ga https qo‘shiladi', () => assert.equal(normalizeLink('t.me/kanal'), 'https://t.me/kanal'));
test('faqat username yozilsa t.me havola bo‘ladi', () => assert.equal(normalizeLink('saidov_savdo'), 'https://t.me/saidov_savdo'));
test('havolasiz matn tugmani o‘chiradi', () => assert.equal(normalizeLink('Yordam markazi'), ''));
test('bo‘sh qiymat bo‘sh qoladi', () => assert.equal(normalizeLink(''), ''));
