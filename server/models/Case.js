const mongoose = require('mongoose');

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
        enum: ['Open', 'In Progress', 'Closed', 'Suspended', 'open', 'in_progress', 'closed', 'suspended'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical', 'low', 'medium', 'high', 'critical'],
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
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.caseNumber = `CASE-${year}-${rand}`;
    }
});


module.exports = mongoose.model('Case', caseSchema);

