const mongoose = require('mongoose');

const custodyBlockSchema = new mongoose.Schema({
    blockIndex: {
        type: Number,
        required: true,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    action: {
        type: String,
        required: true, // e.g., 'EVIDENCE_INGESTED', 'TRANSFER_OF_CUSTODY', 'LAB_EXAMINATION', 'COURT_PRESENTATION', 'SEAL_VERIFIED'
        default: 'EVIDENCE_INGESTED'
    },
    custodian: {
        id: { type: mongoose.Schema.ObjectId, ref: 'User' },
        name: { type: String, default: 'Investigator' },
        role: { type: String, default: 'Investigator' },
        badgeNumber: { type: String, default: 'INV-001' }
    },
    notes: {
        type: String,
        default: 'Initial evidence ingestion and cryptographic seal calculation.'
    },
    prevHash: {
        type: String,
        default: '0000000000000000000000000000000000000000000000000000000000000000'
    },
    hash: {
        type: String,
        required: true
    }
}, { _id: true });

const evidenceSchema = new mongoose.Schema({
    caseId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Case',
        required: true
    },
    uploader: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    storagePublicId: {
        type: String, // Cloudinary authenticated asset id; absent on legacy public uploads
        default: ''
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    fileHash: {
        type: String, // Primary SHA-256 hex digest for tamper detection
        required: true
    },
    md5Hash: {
        type: String,
        default: ''
    },
    sha1Hash: {
        type: String,
        default: ''
    },
    classification: {
        type: String,
        enum: ['Unclassified', 'Confidential', 'Secret', 'Top Secret'],
        default: 'Confidential'
    },
    tags: [{
        type: String
    }],
    metadata: {
        mimeType: String,
        extension: String,
        fileEntropy: Number // Shannon entropy (0-8 bits/byte), computed on ingest
    },
    chainOfCustody: [custodyBlockSchema],
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// Never expose raw storage locations to API consumers; all reads go through
// the authenticated /download and /preview endpoints.
const hideStorage = (doc, ret) => {
    delete ret.filePath;
    delete ret.storagePublicId;
    return ret;
};
evidenceSchema.set('toJSON', { transform: hideStorage });

module.exports = mongoose.model('Evidence', evidenceSchema);

