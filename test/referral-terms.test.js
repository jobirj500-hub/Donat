import { test } from 'node:test';
import assert from 'node:assert/strict';
import { referralTerms } from '../public/referral.js';

test('shows the admin-set bonus amount next to the invite button', () => {
  const r = referralTerms({ ref_bonus: 5000, min_topup: 5000 }, { refs: 3, ref_paid: 1, ref_earned: 5000 });
  assert.equal(r.active, true);
  assert.equal(r.bonus, 5000);
  assert.equal(r.bonusText, '5 000 so‘m');
});

test("conditions say the bonus comes on the friend's first top-up, once per friend", () => {
  const r = referralTerms({ ref_bonus: 5000, min_topup: 5000 });
  assert.ok(r.steps.some((s) => s.includes('birinchi marta to‘ldiradi') && s.includes('kamida 5 000 so‘m')));
  assert.ok(r.rules.some((s) => s.includes('faqat bir marta')));
});

test('a zero bonus is shown as switched off, not as 0 so‘m', () => {
  const r = referralTerms({ ref_bonus: 0 });
  assert.equal(r.active, false);
  assert.equal(r.bonusText, 'Hozircha yo‘q');
});
