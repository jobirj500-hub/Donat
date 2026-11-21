import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'donat-'));
process.env.ADMIN_ID = '7697121574,8787603995';
const { isAdmin, isOwner, setSetting, adminIds } = await import('../src/db.js');

test('ikkala admin ID ham admin', () => {
  assert.equal(isAdmin(7697121574), true);
  assert.equal(isAdmin(8787603995), true);
});
test('oddiy foydalanuvchi admin emas', () => assert.equal(isAdmin(123456), false));
test('paneldan qo‘shilgan admin admin bo‘ladi, lekin asosiy emas', () => {
  setSetting('admin_ids', '555000111');
  assert.equal(isAdmin(555000111), true);
  assert.equal(isOwner(555000111), false);
  assert.equal(adminIds().length, 3);
});
