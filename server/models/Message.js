const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);
