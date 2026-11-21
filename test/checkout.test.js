import {test} from 'node:test';import assert from 'node:assert/strict';
import {topupNeeded,validDraft,canResume,orderBody} from '../public/checkout.js';
const now=1795266000000;const d={user_id:11,game:{slug:'free-fire-cis'},p:{id:7,price:30000},player_id:'5123456789',request_key:'11111111-1111-4111-8111-111111111111',createdAt:now};
test('low balance preserves selected package and fills only missing amount',()=>{assert.equal(topupNeeded(30000,10000,5000,10000000),20000);assert.equal(orderBody(d).player_id,'5123456789');assert.equal(orderBody(d).product_id,7);});
test('topup respects the existing minimum and maximum',()=>{assert.equal(topupNeeded(30000,29000,5000,10000000),5000);assert.equal(topupNeeded(20000000,0,5000,10000000),10000000);});
test('approved draft continues only after balance is sufficient',()=>{assert.equal(canResume(d,29999,11,now),false);assert.equal(canResume(d,30000,11,now),true);});
test('ID validation result is not required to order',()=>{assert.equal(orderBody(d).player_id,'5123456789');assert.equal('validated' in orderBody(d),false);});
test('a draft cannot be resumed by another user or after one hour',()=>{assert.equal(validDraft(d,12,now),false);assert.equal(validDraft(d,11,now+3600000),false);assert.equal(validDraft(d,11,now-1),false);});
test('retry has stable key and never consents to a higher price',()=>{assert.equal(orderBody(d).request_key,d.request_key);assert.equal(orderBody(d).max_price,30000);});
