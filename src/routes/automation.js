const express = require("express");
const automationRouter = express.Router();
const Automation = require("../models/automation");
const Expense = require("../models/expense");
const userAuth = require("../middleware/auth");

// Add new automation rule
automationRouter.post("/automation", userAuth, async (req, res) => {
    try {
        const { name, amount, frequency, category, startDate, endDate, description } = req.body;

        // Validation
        if (!name || !amount || !frequency) {
            return res.status(400).json({ 
                error: "Name, amount and frequency are required" 
            });
        }

        if (amount <= 0) {
            return res.status(400).json({ 
                error: "Amount must be greater than 0" 
            });
        }

        // Create new automation
        const automation = new Automation({
            userId: req.user._id,
            name: name.trim(),
            amount: parseFloat(amount),
            frequency: frequency,
            category: category || 'Other',
            startDate: startDate || Date.now(),
            endDate: endDate || null,
            description: description || ''
        });

        const savedAutomation = await automation.save();

        res.status(201).json({
            message: "Automation created successfully",
            data: savedAutomation
        });

    } catch (err) {
        console.error("Add automation error:", err);
        res.status(400).json({ 
            error: err.message || "Failed to create automation" 
        });
    }
});

// Get all automations for logged-in user
automationRouter.get("/automation", userAuth, async (req, res) => {
    try {
        const automations = await Automation.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Automations fetched successfully",
            count: automations.length,
            data: automations
        });

    } catch (err) {
        console.error("Fetch automations error:", err);
        res.status(500).json({ 
            error: "Failed to fetch automations" 
        });
    }
});

// Get single automation by ID
automationRouter.get("/automation/:id", userAuth, async (req, res) => {
    try {
        const automation = await Automation.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!automation) {
            return res.status(404).json({ 
                error: "Automation not found" 
            });
        }

        res.status(200).json({
            message: "Automation fetched successfully",
            data: automation
        });

    } catch (err) {
        console.error("Fetch automation error:", err);
        res.status(500).json({ 
            error: "Failed to fetch automation" 
        });
    }
});

// Update automation
automationRouter.patch("/automation/:id", userAuth, async (req, res) => {
    try {
        const { name, amount, frequency, category, startDate, endDate, isActive, description } = req.body;
        
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
        if (frequency) updateData.frequency = frequency;
        if (category) updateData.category = category;
        if (startDate) updateData.startDate = startDate;
        if (endDate !== undefined) updateData.endDate = endDate;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (description !== undefined) updateData.description = description;

        const automation = await Automation.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!automation) {
            return res.status(404).json({ 
                error: "Automation not found" 
            });
        }

        res.status(200).json({
            message: "Automation updated successfully",
            data: automation
        });

    } catch (err) {
        console.error("Update automation error:", err);
        res.status(400).json({ 
            error: err.message || "Failed to update automation" 
        });
    }
});

// Delete automation
automationRouter.delete("/automation/:id", userAuth, async (req, res) => {
    try {
        const automation = await Automation.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!automation) {
            return res.status(404).json({ 
                error: "Automation not found" 
            });
        }

        res.status(200).json({
            message: "Automation deleted successfully",
            data: automation
        });

    } catch (err) {
        console.error("Delete automation error:", err);
        res.status(500).json({ 
            error: "Failed to delete automation" 
        });
    }
});

// Toggle automation active status
automationRouter.patch("/automation/:id/toggle", userAuth, async (req, res) => {
    try {
        const automation = await Automation.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!automation) {
            return res.status(404).json({ 
                error: "Automation not found" 
            });
        }

        automation.isActive = !automation.isActive;
        await automation.save();

        res.status(200).json({
            message: `Automation ${automation.isActive ? 'activated' : 'deactivated'} successfully`,
            data: automation
        });

    } catch (err) {
        console.error("Toggle automation error:", err);
        res.status(500).json({ 
            error: "Failed to toggle automation" 
        });
    }
});

// Process automation manually (create expense from automation)
automationRouter.post("/automation/:id/process", userAuth, async (req, res) => {
    try {
        const automation = await Automation.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!automation) {
            return res.status(404).json({ 
                error: "Automation not found" 
            });
        }

        if (!automation.isActive) {
            return res.status(400).json({ 
                error: "Automation is not active" 
            });
        }

        // Create expense from automation
        const expense = new Expense({
            userId: req.user._id,
            name: automation.name,
            amount: automation.amount,
            date: Date.now(),
            category: automation.category,
            description: `Auto-generated from ${automation.frequency} automation`
        });

        const savedExpense = await expense.save();

        // Update last processed date
        automation.lastProcessedDate = Date.now();
        await automation.save();

        res.status(201).json({
            message: "Automation processed successfully",
            data: {
                automation: automation,
                expense: savedExpense
            }
        });

    } catch (err) {
        console.error("Process automation error:", err);
        res.status(500).json({ 
            error: "Failed to process automation" 
        });
    }
});

module.exports = automationRouter;