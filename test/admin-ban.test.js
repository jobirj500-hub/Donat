import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'donat-ban-'));
process.env.ADMIN_ID = '8787603995';
const { db, upsertUser, getUser, setBanned, unbanAdmins, setSetting } = await import('../src/db.js');

test('asosiy adminni bloklab bo‘lmaydi', () => {
  upsertUser({ id: 8787603995, first_name: 'Ega' });
  assert.throws(() => setBanned(8787603995, true), /Adminni bloklab/);
  assert.equal(getUser(8787603995).banned, 0);
});

test('qo‘shimcha adminni ham bloklab bo‘lmaydi', () => {
  setSetting('admin_ids', '555000111');
  upsertUser({ id: 555000111, first_name: 'Admin2' });
  assert.throws(() => setBanned(555000111, true), /Adminni bloklab/);
});

test('oddiy foydalanuvchini bloklash va blokdan chiqarish ishlaydi', () => {
  upsertUser({ id: 123456, first_name: 'Mijoz' });
  setBanned(123456, true);
  assert.equal(getUser(123456).banned, 1);
  setBanned(123456, false);
  assert.equal(getUser(123456).banned, 0);
});

test('avval bloklangan admin botga kirganda avtomatik blokdan chiqadi', () => {
  db.prepare('update users set banned=1 where id=?').run(8787603995);
  const { user } = upsertUser({ id: 8787603995, first_name: 'Ega' });
  assert.equal(user.banned, 0);
});

test('ishga tushganda bloklangan adminlar blokdan chiqariladi, mijozlar emas', () => {
  db.prepare('update users set banned=1 where id in (8787603995, 123456)').run();
  assert.equal(unbanAdmins(), 1);
  assert.equal(getUser(8787603995).banned, 0);
  assert.equal(getUser(123456).banned, 1);
});
