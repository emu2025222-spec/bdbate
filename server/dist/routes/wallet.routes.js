"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const Transaction_1 = require("../models/Transaction");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.post("/deposit-request", async (req, res) => {
    try {
        const { amount, reference } = req.body;
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                message: "Invalid amount",
            });
        }
        if (!reference || String(reference).trim().length < 3) {
            return res.status(400).json({
                message: "Reference is required",
            });
        }
        const transaction = await Transaction_1.Transaction.create({
            userId: req.user.userId,
            type: "DEPOSIT",
            amount: numericAmount,
            status: "PENDING",
            reference: String(reference).trim(),
            description: "Deposit request",
        });
        return res.status(201).json({
            message: "Deposit request submitted",
            transaction,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Could not create deposit request",
        });
    }
});
router.post("/withdraw-request", async (req, res) => {
    try {
        const { amount, reference } = req.body;
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount < 100) {
            return res.status(400).json({
                message: "Minimum withdrawal request is 100 credits",
            });
        }
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        if (user.balance < numericAmount) {
            return res.status(400).json({
                message: "Insufficient balance",
            });
        }
        const existing = await Transaction_1.Transaction.findOne({
            userId: user._id,
            type: "WITHDRAWAL",
            status: "PENDING",
        });
        if (existing) {
            return res.status(400).json({
                message: "You already have a pending withdrawal",
            });
        }
        const transaction = await Transaction_1.Transaction.create({
            userId: user._id,
            type: "WITHDRAWAL",
            amount: numericAmount,
            status: "PENDING",
            reference: reference && String(reference).trim()
                ? String(reference).trim()
                : `WD-${Date.now()}`,
            description: "Withdrawal request",
        });
        return res.status(201).json({
            message: "Withdrawal request submitted",
            transaction,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Could not create withdrawal request",
        });
    }
});
router.get("/balance", async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user.userId).select("name phone balance role");
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        return res.json({
            balance: user.balance,
            user,
        });
    }
    catch {
        return res.status(500).json({
            message: "Could not load balance",
        });
    }
});
router.get("/transactions", async (req, res) => {
    try {
        const transactions = await Transaction_1.Transaction.find({
            userId: req.user.userId,
        })
            .sort({ createdAt: -1 })
            .limit(100);
        return res.json({
            transactions,
        });
    }
    catch {
        return res.status(500).json({
            message: "Could not load transactions",
        });
    }
});
exports.default = router;
