const express = require("express");
const dashboardRouter = express.Router();
const Income = require("../models/income");
const Expense = require("../models/expense");
const Automation = require("../models/automation");
const userAuth = require("../middleware/auth");

// Get complete financial summary
dashboardRouter.get("/dashboard/summary", userAuth, async (req, res) => {
    try {
        // Get total income
        const incomeResult = await Income.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // Get total expense
        const expenseResult = await Expense.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
        const totalExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;
        const balance = totalIncome - totalExpense;

        // Count records
        const incomeCount = await Income.countDocuments({ userId: req.user._id });
        const expenseCount = await Expense.countDocuments({ userId: req.user._id });
        const activeAutomations = await Automation.countDocuments({ 
            userId: req.user._id, 
            isActive: true 
        });

        res.status(200).json({
            message: "Dashboard summary fetched successfully",
            data: {
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                balance: balance,
                incomeCount: incomeCount,
                expenseCount: expenseCount,
                activeAutomations: activeAutomations
            }
        });

    } catch (err) {
        console.error("Dashboard summary error:", err);
        res.status(500).json({ 
            error: "Failed to fetch dashboard summary" 
        });
    }
});

// Get category-wise expense breakdown
dashboardRouter.get("/dashboard/expense-by-category", userAuth, async (req, res) => {
    try {
        const categoryBreakdown = await Expense.aggregate([
            { $match: { userId: req.user._id } },
            { 
                $group: { 
                    _id: "$category", 
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                } 
            },
            { $sort: { total: -1 } }
        ]);

        res.status(200).json({
            message: "Category breakdown fetched successfully",
            data: categoryBreakdown
        });

    } catch (err) {
        console.error("Category breakdown error:", err);
        res.status(500).json({ 
            error: "Failed to fetch category breakdown" 
        });
    }
});

// Get category-wise income breakdown
dashboardRouter.get("/dashboard/income-by-category", userAuth, async (req, res) => {
    try {
        const categoryBreakdown = await Income.aggregate([
            { $match: { userId: req.user._id } },
            { 
                $group: { 
                    _id: "$category", 
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                } 
            },
            { $sort: { total: -1 } }
        ]);

        res.status(200).json({
            message: "Income category breakdown fetched successfully",
            data: categoryBreakdown
        });

    } catch (err) {
        console.error("Income category breakdown error:", err);
        res.status(500).json({ 
            error: "Failed to fetch income category breakdown" 
        });
    }
});

// Get monthly trends (last 6 months)
dashboardRouter.get("/dashboard/monthly-trends", userAuth, async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Monthly income
        const monthlyIncome = await Income.aggregate([
            { 
                $match: { 
                    userId: req.user._id,
                    date: { $gte: sixMonthsAgo }
                } 
            },
            { 
                $group: { 
                    _id: { 
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    total: { $sum: "$amount" }
                } 
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Monthly expense
        const monthlyExpense = await Expense.aggregate([
            { 
                $match: { 
                    userId: req.user._id,
                    date: { $gte: sixMonthsAgo }
                } 
            },
            { 
                $group: { 
                    _id: { 
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    total: { $sum: "$amount" }
                } 
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        res.status(200).json({
            message: "Monthly trends fetched successfully",
            data: {
                income: monthlyIncome,
                expense: monthlyExpense
            }
        });

    } catch (err) {
        console.error("Monthly trends error:", err);
        res.status(500).json({ 
            error: "Failed to fetch monthly trends" 
        });
    }
});

// Get recent transactions (last 10 combined)
dashboardRouter.get("/dashboard/recent-transactions", userAuth, async (req, res) => {
    try {
        const recentIncomes = await Income.find({ userId: req.user._id })
            .sort({ date: -1 })
            .limit(5)
            .lean();

        const recentExpenses = await Expense.find({ userId: req.user._id })
            .sort({ date: -1 })
            .limit(5)
            .lean();

        // Add type field and combine
        const incomeWithType = recentIncomes.map(i => ({ ...i, type: 'income' }));
        const expenseWithType = recentExpenses.map(e => ({ ...e, type: 'expense' }));

        const combined = [...incomeWithType, ...expenseWithType]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        res.status(200).json({
            message: "Recent transactions fetched successfully",
            data: combined
        });

    } catch (err) {
        console.error("Recent transactions error:", err);
        res.status(500).json({ 
            error: "Failed to fetch recent transactions" 
        });
    }
});

module.exports = dashboardRouter;