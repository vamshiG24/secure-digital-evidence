const mongoose = require('mongoose');

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
        type: String, // SHA-256 hex digest for tamper detection
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Evidence', evidenceSchema);
