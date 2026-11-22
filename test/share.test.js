import { test } from 'node:test';
import assert from 'node:assert/strict';
import { referralLink } from '../public/share.js';

test('taklif havolasi bot nomi va foydalanuvchi ID dan tuziladi', () => {
  assert.equal(referralLink('Donat24Bot', 12345), 'https://t.me/Donat24Bot?start=ref12345');
});
test('bot nomidagi @ olib tashlanadi', () => {
  assert.equal(referralLink('@Donat24Bot', 7), 'https://t.me/Donat24Bot?start=ref7');
});
test('bot nomi noma’lum bo‘lsa havola bo‘sh', () => {
  assert.equal(referralLink('', 7), '');
  assert.equal(referralLink(undefined, 7), '');
});
