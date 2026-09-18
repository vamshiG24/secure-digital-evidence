const mongoose = require('mongoose');
const crypto = require('crypto');

const STATUSES = ['Open', 'In Progress', 'Closed', 'Suspended'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// Accept legacy lowercase / snake_case values and normalise to canonical form
const normalise = (allowed) => (v) => {
    if (typeof v !== 'string') return v;
    const key = v.replace(/_/g, ' ').toLowerCase();
    return allowed.find(a => a.toLowerCase() === key) || v;
};

const investigatorNoteSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    authorName: {
        type: String,
        default: 'Investigator'
    },
    note: {
        type: String,
        required: true
    },
    classification: {
        type: String,
        enum: ['Routine', 'Confidential', 'Restricted', 'Court Evidence'],
        default: 'Routine'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const caseSchema = new mongoose.Schema({
    caseNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    title: {
        type: String,
        required: [true, 'Please add a case title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    status: {
        type: String,
        enum: STATUSES,
        set: normalise(STATUSES),
        default: 'Open'
    },
    priority: {
        type: String,
        enum: PRIORITIES,
        set: normalise(PRIORITIES),
        default: 'Medium'
    },
    tags: [{
        type: String,
        default: ['Digital Forensics']
    }],
    incidentDate: {
        type: Date,
        default: Date.now
    },
    courtReference: {
        type: String,
        default: ''
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: false
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    investigatorNotes: [investigatorNoteSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-generate caseNumber if not present before saving
caseSchema.pre('save', function () {
    if (!this.caseNumber) {
        const year = new Date().getFullYear();
        const rand = crypto.randomInt(100000, 999999);
        this.caseNumber = `CASE-${year}-${rand}`;
    }
});


module.exports = mongoose.model('Case', caseSchema);

