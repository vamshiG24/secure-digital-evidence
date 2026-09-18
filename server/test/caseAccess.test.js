const test = require('node:test');
const assert = require('node:assert/strict');
const { canAccessCase } = require('../utils/caseAccess');

const admin = { _id: '1', role: 'admin' };
const analyst = { _id: '2', role: 'analyst' };
const inv = { _id: '3', role: 'investigator' };
const other = { _id: '4', role: 'investigator' };

test('admin and analyst can access any case', () => {
    const c = { createdBy: '9', assignedTo: '8' };
    assert.equal(canAccessCase(admin, c), true);
    assert.equal(canAccessCase(analyst, c), true);
});

test('investigator can access only created or assigned cases', () => {
    assert.equal(canAccessCase(inv, { createdBy: '3' }), true);
    assert.equal(canAccessCase(inv, { assignedTo: { _id: '3' } }), true);
    assert.equal(canAccessCase(other, { createdBy: '3', assignedTo: '3' }), false);
});

test('missing user or case is denied', () => {
    assert.equal(canAccessCase(null, { createdBy: '3' }), false);
    assert.equal(canAccessCase(inv, null), false);
});
