const express = require("express");
const incomeRouter = express.Router();
const Income = require("../models/income");
const userAuth = require("../middleware/auth");

// Add new income (Protected)
incomeRouter.post("/income", userAuth, async (req, res) => {
    try {
        const { name, amount, date, category, description } = req.body;

        // Validation
        if (!name || !amount) {
            return res.status(400).json({ 
                error: "Income name and amount are required" 
            });
        }

        if (amount <= 0) {
            return res.status(400).json({ 
                error: "Amount must be greater than 0" 
            });
        }

        // Create new income
        const income = new Income({
            userId: req.user._id,
            name: name.trim(),
            amount: parseFloat(amount),
            date: date || Date.now(),
            category: category || 'Other',
            description: description || ''
        });

        const savedIncome = await income.save();

        res.status(201).json({
            message: "Income added successfully",
            data: savedIncome
        });

    } catch (err) {
        console.error("Add income error:", err);
        res.status(400).json({ 
            error: err.message || "Failed to add income" 
        });
    }
});

// Get all incomes for logged-in user
incomeRouter.get("/income", userAuth, async (req, res) => {
    try {
        const incomes = await Income.find({ userId: req.user._id })
            .sort({ date: -1 });

        res.status(200).json({
            message: "Incomes fetched successfully",
            count: incomes.length,
            data: incomes
        });

    } catch (err) {
        console.error("Fetch incomes error:", err);
        res.status(500).json({ 
            error: "Failed to fetch incomes" 
        });
    }
});

// Get single income by ID
incomeRouter.get("/income/:id", userAuth, async (req, res) => {
    try {
        const income = await Income.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!income) {
            return res.status(404).json({ 
                error: "Income not found" 
            });
        }

        res.status(200).json({
            message: "Income fetched successfully",
            data: income
        });

    } catch (err) {
        console.error("Fetch income error:", err);
        res.status(500).json({ 
            error: "Failed to fetch income" 
        });
    }
});

// Update income
incomeRouter.patch("/income/:id", userAuth, async (req, res) => {
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

        const income = await Income.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!income) {
            return res.status(404).json({ 
                error: "Income not found" 
            });
        }

        res.status(200).json({
            message: "Income updated successfully",
            data: income
        });

    } catch (err) {
        console.error("Update income error:", err);
        res.status(400).json({ 
            error: err.message || "Failed to update income" 
        });
    }
});

// Delete income
incomeRouter.delete("/income/:id", userAuth, async (req, res) => {
    try {
        const income = await Income.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!income) {
            return res.status(404).json({ 
                error: "Income not found" 
            });
        }

        res.status(200).json({
            message: "Income deleted successfully",
            data: income
        });

    } catch (err) {
        console.error("Delete income error:", err);
        res.status(500).json({ 
            error: "Failed to delete income" 
        });
    }
});

// Get total income for user
incomeRouter.get("/income/total/sum", userAuth, async (req, res) => {
    try {
        const result = await Income.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: null, totalIncome: { $sum: "$amount" } } }
        ]);

        const totalIncome = result.length > 0 ? result[0].totalIncome : 0;

        res.status(200).json({
            message: "Total income calculated successfully",
            data: {
                totalIncome: totalIncome
            }
        });

    } catch (err) {
        console.error("Calculate total income error:", err);
        res.status(500).json({ 
            error: "Failed to calculate total income" 
        });
    }
});

module.exports = incomeRouter;