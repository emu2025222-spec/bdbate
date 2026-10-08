import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import walletRoutes from "./routes/wallet.routes";
import adminRoutes from "./routes/admin.routes";
import gameRoutes from "./routes/game.routes";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "BD BEST BETTING WEB API",
    status: "running",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/game", gameRoutes);

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

async function startServer() {
  try {
    await mongoose.connect(env.mongoUri);

    console.log("MongoDB connected");

    app.listen(env.port, () => {
      console.log(
        `Server running on http://localhost:${env.port}`
      );
    });
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error
    );

    process.exit(1);
  }
}

startServer();