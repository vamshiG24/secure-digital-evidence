const test = require('node:test');
const assert = require('node:assert/strict');
const escapeRegex = require('../utils/escapeRegex');

test('escapes every regex metacharacter', () => {
    const input = '.*+?^${}()|[]\\';
    const rx = new RegExp(escapeRegex(input));
    assert.equal(rx.test(input), true);
    assert.equal(rx.test('anything else'), false);
});

test('catastrophic patterns become literal text', () => {
    const evil = '(a+)+$';
    assert.equal(escapeRegex(evil), '\\(a\\+\\)\\+\\$');
    assert.equal(new RegExp(escapeRegex(evil)).test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab'), false);
});

test('handles non-string input safely', () => {
    assert.equal(escapeRegex(undefined), '');
    assert.equal(escapeRegex(42), '42');
});
