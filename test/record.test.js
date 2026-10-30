// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const Q = require('..');
const key = () => Q.generateKey();
const mk = (k) => Q.issue({ key: k, project: 'Amazon REDD 0041', vintage: 2026, tonnes: 100000, methodology: 'vm0007', registrarLabel: 'Verra' });

test('an issued credit is a well formed signed record of the registry', () => {
  const r = key(); const c = mk(r);
  assert.strictEqual(c.format, 'qcarbon/1');
  assert.strictEqual(c.type, 'issue');
  assert.strictEqual(c.signer.id, Q.keyId(r));
  assert.strictEqual(c.statement.registrarKeyId, Q.keyId(r));
  assert.match(c.statement.creditId, /^[0-9a-f]{32}$/);
  assert.strictEqual(c.statement.tonnes, 100000);
});

test('attest transfer retire chain to the same credit', () => {
  const r = key(); const vvb = key(); const buyer = key();
  const c = mk(r);
  const a = Q.attest({ key: vvb, credit: c, body: 'tuv_sud', outcome: 'validated' });
  const moved = Q.transfer({ key: r, credit: c, to: Q.keyId(buyer) });
  const gone = Q.retire({ key: buyer, credit: moved, beneficiary: 'City of Oslo', reason: '2026 compliance' });
  assert.strictEqual(a.statement.creditId, c.statement.creditId);
  assert.strictEqual(a.statement.creditRef, Q.recordRef(c));
  assert.strictEqual(a.statement.outcome, 'validated');
  assert.strictEqual(moved.statement.toKeyId, Q.keyId(buyer));
  assert.strictEqual(gone.statement.beneficiary, 'City of Oslo');
});

test('invalid inputs are refused before anything is signed', () => {
  const k = key();
  const base = { key: k, project: 'P', vintage: 2026, tonnes: 10, methodology: 'vm0007' };
  assert.throws(() => Q.issue(Object.assign({}, base, { vintage: 1900 })), /vintage must be a whole number of at least/);
  assert.throws(() => Q.issue(Object.assign({}, base, { tonnes: 0 })), /tonnes must be a whole number/);
  assert.throws(() => Q.issue(Object.assign({}, base, { methodology: 'VM0007' })), /methodology must be/);
  assert.throws(() => Q.issue(Object.assign({}, base, { extra: 1 })), /is not an option of issue/);
  const c = mk(k);
  assert.throws(() => Q.attest({ key: key(), credit: c, body: 'tuv', outcome: 'maybe' }), /outcome/);
});

test('a well formed record verifies and a type mismatch or tamper is invalid', async () => {
  const r = key(); const c = mk(r);
  const OPTS = { network: 'testnet', requireAnchor: false, strict: false };
  const ok = await Q.verify(c, Object.assign({ type: 'issue' }, OPTS));
  assert.strictEqual(ok.status, 'valid');
  assert.strictEqual(ok.creditId, c.statement.creditId);
  assert.strictEqual((await Q.verify(c, Object.assign({ type: 'transfer' }, OPTS))).status, 'invalid');
  const f = JSON.parse(JSON.stringify(c)); f.statement.tonnes = 1;
  assert.strictEqual((await Q.verify(f, Object.assign({ type: 'issue' }, OPTS))).status, 'invalid');
});

test('the prior link binds a record and the kind and constants are pinned', async () => {
  const r = key(); const vvb = key();
  const c = mk(r);
  const a = Q.attest({ key: vvb, credit: c, body: 'tuv_sud', outcome: 'validated' });
  const good = await Q.verify(a, { type: 'attest', network: 'testnet', requireAnchor: false, strict: false, prior: c });
  assert.ok(good.checks.some((x) => x.name === 'prior' && x.ok));
  assert.strictEqual(Q.KIND, 1305);
  assert.strictEqual(Q.FORMAT, 'qcarbon/1');
  assert.deepStrictEqual([...Q.TYPES], ['issue', 'attest', 'transfer', 'retire']);
});
