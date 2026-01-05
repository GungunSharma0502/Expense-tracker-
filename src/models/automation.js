const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    frequency: {
        type: String,
        enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
        required: true,
        default: 'Monthly'
    },
    category: {
        type: String,
        enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Healthcare', 'Entertainment', 'Education', 'Other'],
        default: 'Other'
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastProcessedDate: {
        type: Date
    },
    description: {
        type: String,
        maxlength: 300
    }
}, { timestamps: true });

// Index for faster queries
automationSchema.index({ userId: 1, isActive: 1, frequency: 1 });

module.exports = mongoose.model('Automation', automationSchema);