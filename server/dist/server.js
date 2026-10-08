"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./config/env");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const wallet_routes_1 = __importDefault(require("./routes/wallet.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const game_routes_1 = __importDefault(require("./routes/game.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.json({
        name: "BD BEST BETTING WEB API",
        status: "running",
    });
});
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        database: mongoose_1.default.connection.readyState === 1
            ? "connected"
            : "disconnected",
    });
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/wallet", wallet_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/game", game_routes_1.default);
app.use((_req, res) => {
    res.status(404).json({
        message: "Route not found",
    });
});
async function startServer() {
    try {
        await mongoose_1.default.connect(env_1.env.mongoUri);
        console.log("MongoDB connected");
        app.listen(env_1.env.port, () => {
            console.log(`Server running on http://localhost:${env_1.env.port}`);
        });
    }
    catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}
startServer();
