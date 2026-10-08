"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/register", async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        if (!name || !phone || !password) {
            return res.status(400).json({
                message: "Name, phone and password are required",
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }
        const existing = await User_1.User.findOne({ phone });
        if (existing) {
            return res.status(409).json({
                message: "Phone number already registered",
            });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = await User_1.User.create({
            name,
            phone,
            passwordHash,
            role: "PLAYER",
            balance: 0,
        });
        const token = (0, jwt_1.createToken)({
            userId: user._id.toString(),
            role: user.role,
        });
        return res.status(201).json({
            message: "Account created successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                balance: user.balance,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Registration failed",
        });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({
                message: "Phone and password are required",
            });
        }
        const user = await User_1.User.findOne({ phone });
        if (!user) {
            return res.status(401).json({
                message: "Invalid phone or password",
            });
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({
                message: "Invalid phone or password",
            });
        }
        const token = (0, jwt_1.createToken)({
            userId: user._id.toString(),
            role: user.role,
        });
        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                balance: user.balance,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Login failed",
        });
    }
});
router.get("/me", auth_1.requireAuth, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user.userId).select("-passwordHash");
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        return res.json({
            user,
        });
    }
    catch {
        return res.status(500).json({
            message: "Failed to load profile",
        });
    }
});
exports.default = router;
