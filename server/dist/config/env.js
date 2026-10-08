"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const required = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
};
exports.env = {
    port: Number(process.env.PORT || 5000),
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: required("MONGO_URI"),
    jwtSecret: required("JWT_SECRET"),
};
