const test = require('node:test');
const assert = require('node:assert/strict');
const { createBlock, verifyChain, GENESIS_PREV_HASH } = require('../utils/custodyChain');

const FILE_HASH = 'a'.repeat(64);
const custodian = (name) => ({ name, role: 'Investigator', badgeNumber: 'INV-1' });

const buildChain = () => {
    const genesis = createBlock({ prevBlock: null, action: 'EVIDENCE_INGESTED', custodian: custodian('Alice'), notes: 'Seized', fileHash: FILE_HASH });
    const transfer = createBlock({ prevBlock: genesis, action: 'TRANSFER_OF_CUSTODY', custodian: custodian('Bob'), notes: 'To lab', fileHash: FILE_HASH });
    return [genesis, transfer];
};

test('genesis block anchors to the zero hash and index 0', () => {
    const [genesis] = buildChain();
    assert.equal(genesis.blockIndex, 0);
    assert.equal(genesis.prevHash, GENESIS_PREV_HASH);
    assert.match(genesis.hash, /^[a-f0-9]{64}$/);
});

test('a well-formed chain verifies', () => {
    const result = verifyChain(buildChain(), FILE_HASH);
    assert.equal(result.valid, true);
    assert.equal(result.brokenIndex, -1);
});

test('editing a block body (not just links) is detected', () => {
    const chain = buildChain();
    chain[1].custodian.name = 'Mallory';
    const result = verifyChain(chain, FILE_HASH);
    assert.equal(result.valid, false);
    assert.equal(result.brokenIndex, 1);
    assert.match(result.reason, /contents/);
});

test('changing the underlying file hash breaks every block', () => {
    const result = verifyChain(buildChain(), 'b'.repeat(64));
    assert.equal(result.valid, false);
    assert.equal(result.brokenIndex, 0);
});

test('a broken prevHash link is detected', () => {
    const chain = buildChain();
    chain[1].prevHash = 'f'.repeat(64);
    const result = verifyChain(chain, FILE_HASH);
    assert.equal(result.valid, false);
    assert.match(result.reason, /link/);
});

test('a re-ordered chain is detected', () => {
    const chain = buildChain().reverse();
    assert.equal(verifyChain(chain, FILE_HASH).valid, false);
});
