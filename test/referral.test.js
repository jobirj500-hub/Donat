import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'donat-ref-'));
process.env.D24_API_KEY = 'test-key';

const { db, getUser, setSetting } = await import('../src/db.js');
const { decideTopup } = await import('../src/topups.js');

db.prepare('insert into users(id,first_name,balance) values(?,?,?)').run(1, 'Referrer', 0);
db.prepare('insert into users(id,first_name,balance,ref_by) values(?,?,?,?)').run(2, 'Friend', 0, 1);
db.prepare('insert into users(id,first_name,balance) values(?,?,?)').run(3, 'NoRef', 0);

const newTopup = (userId, amount) =>
  db.prepare('insert into topups(user_id,amount) values(?,?)').run(userId, amount).lastInsertRowid;

test('referrer gets the bonus when the invited friend tops up for the first time', async () => {
  setSetting('ref_bonus', '5000');
  await decideTopup(newTopup(2, 20000), true, 99);
  assert.equal(getUser(1).balance, 5000);
  assert.equal(getUser(2).balance, 20000);
});

test('the same friend pays the bonus only once', async () => {
  await decideTopup(newTopup(2, 30000), true, 99);
  assert.equal(getUser(1).balance, 5000);
  assert.equal(getUser(2).balance, 50000);
});

test('no bonus when the setting is off or the user has no referrer', async () => {
  setSetting('ref_bonus', '0');
  await decideTopup(newTopup(2, 10000), true, 99);
  setSetting('ref_bonus', '5000');
  await decideTopup(newTopup(3, 10000), true, 99);
  assert.equal(getUser(1).balance, 5000);
  assert.equal(getUser(3).balance, 10000);
});
