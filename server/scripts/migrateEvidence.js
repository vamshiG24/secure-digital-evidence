/**
 * One-off migration for evidence created before private storage and the
 * hash-linked ledger were introduced.
 *
 * For every evidence record without `storagePublicId`:
 *   1. download the file from its public URL and verify it still matches fileHash
 *   2. re-upload it as an authenticated (private) asset
 *   3. delete the public copy from Cloudinary
 *   4. re-seal the custody ledger: every existing block keeps its data
 *      (action, custodian, notes, timestamp) but gets a hash computed with the
 *      current scheme so `verifyChain` passes
 *
 * Usage:  node scripts/migrateEvidence.js            (dry run)
 *         node scripts/migrateEvidence.js --apply    (write changes)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const Evidence = require('../models/Evidence');
const { uploadBuffer, fetchBuffer, safeFileName } = require('../utils/storage');
const { computeBlockHash, verifyChain, GENESIS_PREV_HASH } = require('../utils/custodyChain');

const APPLY = process.argv.includes('--apply');

const resealChain = (chain, fileHash) => {
    let prevHash = GENESIS_PREV_HASH;
    return chain.map((block, i) => {
        const next = {
            blockIndex: i,
            timestamp: block.timestamp || new Date(),
            action: block.action || (i === 0 ? 'EVIDENCE_INGESTED' : 'TRANSFER_OF_CUSTODY'),
            custodian: block.custodian || { name: 'Unknown', role: 'Investigator', badgeNumber: 'N/A' },
            notes: block.notes || '',
            prevHash
        };
        next.hash = computeBlockHash(next, fileHash);
        prevHash = next.hash;
        return next;
    });
};

const publicIdFromUrl = (url) => {
    // https://res.cloudinary.com/<cloud>/raw/upload/v123/folder/name.ext -> folder/name.ext
    const m = url.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
};

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const legacy = await Evidence.find({ $or: [{ storagePublicId: { $exists: false } }, { storagePublicId: '' }] });
    console.log(`${legacy.length} legacy evidence record(s) found. Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);

    let migrated = 0, skipped = 0;
    for (const ev of legacy) {
        const label = `${ev._id} ${ev.fileName}`;
        const buffer = await fetchBuffer(ev.filePath);
        if (!buffer) { console.warn(`  SKIP ${label}: file could not be downloaded`); skipped++; continue; }

        const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
        if (sha256 !== ev.fileHash) {
            console.warn(`  SKIP ${label}: stored hash does not match file (${sha256.slice(0, 12)} != ${ev.fileHash.slice(0, 12)}) - possible tampering, leaving untouched`);
            skipped++; continue;
        }

        const ledgerBefore = verifyChain(ev.chainOfCustody, ev.fileHash);
        console.log(`  ${label}: hash OK, ledger ${ledgerBefore.valid ? 'already valid' : 'needs re-seal'} (${ev.chainOfCustody.length} blocks)`);
        if (!APPLY) continue;

        const upload = await uploadBuffer(buffer, {
            folder: 'secure-digital-evidence',
            publicId: `${Date.now()}-${safeFileName(ev.fileName)}`
        });

        const oldPublicId = publicIdFromUrl(ev.filePath);
        ev.filePath = upload.secure_url;
        ev.storagePublicId = upload.public_id;
        if (!ledgerBefore.valid) ev.chainOfCustody = resealChain(ev.chainOfCustody, ev.fileHash);
        await ev.save();

        if (oldPublicId) {
            try {
                await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'raw', type: 'upload' });
            } catch (err) {
                console.warn(`  WARN could not delete public copy ${oldPublicId}: ${err.message}`);
            }
        }
        migrated++;
        console.log(`  MIGRATED ${label}`);
    }

    console.log(`Done. migrated=${migrated} skipped=${skipped}${APPLY ? '' : ' (dry run - re-run with --apply)'}`);
    await mongoose.disconnect();
};

run().catch((err) => { console.error(err); process.exit(1); });
