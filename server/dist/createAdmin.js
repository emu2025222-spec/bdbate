"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("./models/User");
dotenv_1.default.config();
async function createAdmin() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing");
        }
        const phone = process.env.ADMIN_PHONE;
        const password = process.env.ADMIN_PASSWORD;
        const name = process.env.ADMIN_NAME || "BD Best Admin";
        if (!phone) {
            throw new Error("ADMIN_PHONE is missing in .env");
        }
        if (!password) {
            throw new Error("ADMIN_PASSWORD is missing in .env");
        }
        console.log("Connecting to MongoDB...");
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("MongoDB connected.");
        const existingUser = await User_1.User.findOne({
            phone: phone.trim(),
        });
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        if (existingUser) {
            existingUser.name = name.trim();
            existingUser.passwordHash = passwordHash;
            existingUser.role = "ADMIN";
            await existingUser.save();
            console.log("");
            console.log("=================================");
            console.log("ADMIN ACCOUNT UPDATED");
            console.log("=================================");
            console.log(`Name: ${existingUser.name}`);
            console.log(`Phone: ${existingUser.phone}`);
            console.log("Role: ADMIN");
            console.log("=================================");
            await mongoose_1.default.disconnect();
            return;
        }
        const admin = await User_1.User.create({
            name: name.trim(),
            phone: phone.trim(),
            passwordHash,
            role: "ADMIN",
            balance: 0,
        });
        console.log("");
        console.log("=================================");
        console.log("ADMIN ACCOUNT CREATED");
        console.log("=================================");
        console.log(`Name: ${admin.name}`);
        console.log(`Phone: ${admin.phone}`);
        console.log("Role: ADMIN");
        console.log("=================================");
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error("");
        console.error("ADMIN SETUP FAILED");
        console.error(error);
        try {
            await mongoose_1.default.disconnect();
        }
        catch {
            // Ignore disconnect error
        }
        process.exit(1);
    }
}
createAdmin();
