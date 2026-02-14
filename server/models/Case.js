const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
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
        enum: ['Open', 'In Progress', 'Closed'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
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
    embedding: {
        type: [Number],
        required: false,
        select: false // Don't return by default for performance
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to generate embeddings
// Pre-save hook to generate embeddings - REMOVED AS PER USER REQUEST
// caseSchema.pre('save', async function (next) { ... });

module.exports = mongoose.model('Case', caseSchema);
