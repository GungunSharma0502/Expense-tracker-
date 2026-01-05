const express = require("express");
const expenseRouter = express.Router();
const Expense = require("../models/expense");
const Income = require("../models/income");
const userAuth = require("../middleware/auth");

// Add new expense (Protected - requires income first)
expenseRouter.post("/expense", userAuth, async (req, res) => {
    try {
        // Check if user has any income
        const hasIncome = await Income.findOne({ userId: req.user._id });
        
        if (!hasIncome) {
            return res.status(400).json({ 
                error: "Please add income first before adding expenses" 
            });
        }

        const { name, amount, date, category, description } = req.body;

        // Validation
        if (!name || !amount) {
            return res.status(400).json({ 
                error: "Expense name and amount are required" 
            });
        }

        if (amount <= 0) {
            return res.status(400).json({ 
                error: "Amount must be greater than 0" 
            });
        }

        // Create new expense
        const expense = new Expense({
            userId: req.user._id,
            name: name.trim(),
            amount: parseFloat(amount),
            date: date || Date.now(),
            category: category || 'Other',
            description: description || ''
        });

        const savedExpense = await expense.save();

        res.status(201).json({
            message: "Expense added successfully",
            data: savedExpense
        });

    } catch (err) {
        console.error("Add expense error:", err);
        res.status(400).json({ 
            error: err.message || "Failed to add expense" 
        });
    }
});

// Get all expenses for logged-in user
expenseRouter.get("/expense", userAuth, async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user._id })
            .sort({ date: -1 });

        res.status(200).json({
            message: "Expenses fetched successfully",
            count: expenses.length,
            data: expenses
        });

    } catch (err) {
        console.error("Fetch expenses error:", err);
        res.status(500).json({ 
            error: "Failed to fetch expenses" 
        });
    }
});

// Get single expense by ID
expenseRouter.get("/expense/:id", userAuth, async (req, res) => {
    try {
        const expense = await Expense.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!expense) {
            return res.status(404).json({ 
                error: "Expense not found" 
            });
        }

        res.status(200).json({
            message: "Expense fetched successfully",
            data: expense
        });

    } catch (err) {
        console.error("Fetch expense error:", err);
        res.status(500).json({ 
            error: "Failed to fetch expense" 
        });
    }
});

// Update expense
expenseRouter.patch("/expense/:id", userAuth, async (req, res) => {
    try {
        const { name, amount, date, category, description } = req.body;
        
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (amount) {
            if (amount <= 0) {
                return res.status(400).json({ 
                    error: "Amount must be greater than 0" 
                });
            }
            updateData.amount = parseFloat(amount);
        }
        if (date) updateData.date = date;
        if (category) updateData.category = category;
        if (description !== undefined) updateData.description = description;

        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!expense) {
            return res.status(404).json({ 
                error: "Expense not found" 
            });
        }

        res.status(200).json({
            message: "Expense updated successfully",
            data: expense
        });

    } catch (err) {
        console.error("Update expense error:", err);
        res.status(400).json({ 
            error: err.message || "Failed to update expense" 
        });
    }
});

// Delete expense
expenseRouter.delete("/expense/:id", userAuth, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!expense) {
            return res.status(404).json({ 
                error: "Expense not found" 
            });
        }

        res.status(200).json({
            message: "Expense deleted successfully",
            data: expense
        });

    } catch (err) {
        console.error("Delete expense error:", err);
        res.status(500).json({ 
            error: "Failed to delete expense" 
        });
    }
});

// Get total expense for user
expenseRouter.get("/expense/total/sum", userAuth, async (req, res) => {
    try {
        const result = await Expense.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: null, totalExpense: { $sum: "$amount" } } }
        ]);

        const totalExpense = result.length > 0 ? result[0].totalExpense : 0;

        res.status(200).json({
            message: "Total expense calculated successfully",
            data: {
                totalExpense: totalExpense
            }
        });

    } catch (err) {
        console.error("Calculate total expense error:", err);
        res.status(500).json({ 
            error: "Failed to calculate total expense" 
        });
    }
});

module.exports = expenseRouter;