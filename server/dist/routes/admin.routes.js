"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Transaction_1 = require("../models/Transaction");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/*
 * Get all pending deposit requests
 */
router.get("/credit-requests", auth_1.requireAuth, auth_1.requireAdmin, async (_req, res) => {
    try {
        const requests = await Transaction_1.Transaction.find({
            type: "DEPOSIT",
            status: "PENDING",
        })
            .populate("userId", "name phone balance")
            .sort({ createdAt: -1 });
        return res.json({
            requests,
        });
    }
    catch (error) {
        console.error("Admin credit requests error:", error);
        return res.status(500).json({
            message: "Failed to load credit requests",
        });
    }
});
/*
 * Approve a deposit request
 */
router.post("/credit-requests/:id/approve", auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const transaction = await Transaction_1.Transaction.findOne({
            _id: req.params.id,
            type: "DEPOSIT",
            status: "PENDING",
        }).session(session);
        if (!transaction) {
            await session.abortTransaction();
            return res.status(404).json({
                message: "Pending deposit request not found",
            });
        }
        const user = await User_1.User.findById(transaction.userId).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({
                message: "Player account not found",
            });
        }
        user.balance += transaction.amount;
        transaction.status = "APPROVED";
        transaction.description =
            "Deposit request approved by admin";
        await user.save({ session });
        await transaction.save({ session });
        await session.commitTransaction();
        return res.json({
            message: "Deposit request approved",
            balance: user.balance,
            transaction,
        });
    }
    catch (error) {
        await session.abortTransaction();
        console.error("Approve deposit request error:", error);
        return res.status(500).json({
            message: "Failed to approve deposit request",
        });
    }
    finally {
        await session.endSession();
    }
});
/*
 * Reject a deposit request
 */
router.post("/credit-requests/:id/reject", auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const transaction = await Transaction_1.Transaction.findOne({
            _id: req.params.id,
            type: "DEPOSIT",
            status: "PENDING",
        });
        if (!transaction) {
            return res.status(404).json({
                message: "Pending deposit request not found",
            });
        }
        transaction.status = "REJECTED";
        transaction.description =
            "Deposit request rejected by admin";
        await transaction.save();
        return res.json({
            message: "Deposit request rejected",
            transaction,
        });
    }
    catch (error) {
        console.error("Reject deposit request error:", error);
        return res.status(500).json({
            message: "Failed to reject deposit request",
        });
    }
});
exports.default = router;
