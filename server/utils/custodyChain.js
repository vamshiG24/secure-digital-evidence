const crypto = require('crypto');

const GENESIS_PREV_HASH = '0'.repeat(64);

/**
 * Canonical payload for a chain-of-custody block. Every field that matters for
 * evidentiary integrity is included so that editing any of them (action,
 * custodian, notes, timestamp) invalidates the block hash. The evidence file
 * hash is mixed into every block so the ledger is bound to the file itself.
 */
const blockPayload = (block, fileHash) => [
    block.blockIndex,
    block.prevHash,
    block.action,
    block.custodian?.name || '',
    block.custodian?.badgeNumber || '',
    block.notes || '',
    new Date(block.timestamp).toISOString(),
    fileHash
].join('|');

const computeBlockHash = (block, fileHash) =>
    crypto.createHash('sha256').update(blockPayload(block, fileHash)).digest('hex');

/**
 * Build a new block that links to `prevBlock` (or genesis when null).
 */
const createBlock = ({ prevBlock, action, custodian, notes, fileHash }) => {
    const block = {
        blockIndex: prevBlock ? prevBlock.blockIndex + 1 : 0,
        timestamp: new Date(),
        action,
        custodian,
        notes,
        prevHash: prevBlock ? prevBlock.hash : GENESIS_PREV_HASH
    };
    block.hash = computeBlockHash(block, fileHash);
    return block;
};

/**
 * Verify the full ledger: genesis anchoring, link continuity and per-block hash
 * recomputation. Returns the first broken index (or -1) and a reason.
 */
const verifyChain = (chain = [], fileHash) => {
    if (chain.length === 0) return { valid: true, brokenIndex: -1, reason: 'Empty chain' };

    for (let i = 0; i < chain.length; i++) {
        const block = chain[i];
        if (block.blockIndex !== i) {
            return { valid: false, brokenIndex: i, reason: 'Block index out of sequence' };
        }
        const expectedPrev = i === 0 ? GENESIS_PREV_HASH : chain[i - 1].hash;
        if (block.prevHash !== expectedPrev) {
            return { valid: false, brokenIndex: i, reason: 'Previous-hash link broken' };
        }
        if (computeBlockHash(block, fileHash) !== block.hash) {
            return { valid: false, brokenIndex: i, reason: 'Block contents do not match stored hash' };
        }
    }
    return { valid: true, brokenIndex: -1, reason: 'All blocks verified' };
};

module.exports = { GENESIS_PREV_HASH, computeBlockHash, createBlock, verifyChain };
