const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    category: {
        type: String,
        enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Healthcare', 'Entertainment', 'Education', 'Other'],
        default: 'Other'
    },
    description: {
        type: String,
        maxlength: 300
    }
}, { timestamps: true });

// Index for faster queries
expenseSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);