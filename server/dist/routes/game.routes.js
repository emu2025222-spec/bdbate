"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const Transaction_1 = require("../models/Transaction");
const GameRound_1 = require("../models/GameRound");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const ROUND_TICK_MS = 100;
const NEW_ROUND_DELAY_MS = 1200;
let roundLoopStarted = false;
let nextRoundTimer = null;
function generateCrashPoint() {
    const random = Math.random();
    if (random < 0.08) {
        return Number((1.01 + Math.random() * 0.34).toFixed(2));
    }
    if (random < 0.32) {
        return Number((1.35 + Math.random() * 1.15).toFixed(2));
    }
    if (random < 0.72) {
        return Number((2.5 + Math.random() * 2.5).toFixed(2));
    }
    if (random < 0.93) {
        return Number((5 + Math.random() * 5).toFixed(2));
    }
    return Number((10 + Math.random() * 15).toFixed(2));
}
function calculateMultiplier(startedAt) {
    const elapsed = (Date.now() - startedAt.getTime()) / 1000;
    const multiplier = 1 +
        elapsed * 0.18 +
        elapsed * elapsed * 0.018;
    return Number(multiplier.toFixed(2));
}
async function getNextRoundNumber() {
    const latest = await GameRound_1.GameRound.findOne()
        .sort({ roundNumber: -1 })
        .select("roundNumber")
        .lean();
    return latest?.roundNumber
        ? latest.roundNumber + 1
        : 1;
}
async function createContinuousRound() {
    const existing = await GameRound_1.GameRound.findOne({
        status: "RUNNING",
    });
    if (existing) {
        return existing;
    }
    const roundNumber = await getNextRoundNumber();
    const round = await GameRound_1.GameRound.create({
        roundNumber,
        crashPoint: generateCrashPoint(),
        status: "RUNNING",
        startedAt: new Date(),
    });
    console.log(`[AVIATOR] Round #${round.roundNumber} started`);
    return round;
}
async function crashCurrentRound(round) {
    if (round.status !== "RUNNING") {
        return;
    }
    const updated = await GameRound_1.GameRound.findOneAndUpdate({
        _id: round._id,
        status: "RUNNING",
    }, {
        $set: {
            status: "CRASHED",
            crashedAt: new Date(),
        },
    }, {
        new: true,
    });
    if (!updated) {
        return;
    }
    console.log(`[AVIATOR] Round #${updated.roundNumber} crashed at ${Number(updated.crashPoint).toFixed(2)}x`);
    if (nextRoundTimer) {
        clearTimeout(nextRoundTimer);
    }
    nextRoundTimer = setTimeout(async () => {
        nextRoundTimer = null;
        try {
            await createContinuousRound();
        }
        catch (error) {
            console.error("[AVIATOR] Could not create next round:", error);
        }
    }, NEW_ROUND_DELAY_MS);
}
async function runRoundLoop() {
    if (roundLoopStarted) {
        return;
    }
    roundLoopStarted = true;
    try {
        await createContinuousRound();
    }
    catch (error) {
        console.error("[AVIATOR] Initial round error:", error);
    }
    setInterval(async () => {
        try {
            const round = await GameRound_1.GameRound.findOne({
                status: "RUNNING",
            }).sort({
                startedAt: -1,
            });
            if (!round) {
                await createContinuousRound();
                return;
            }
            const multiplier = calculateMultiplier(round.startedAt);
            if (multiplier >=
                Number(round.crashPoint)) {
                await crashCurrentRound(round);
            }
        }
        catch (error) {
            console.error("[AVIATOR] Round engine error:", error);
        }
    }, ROUND_TICK_MS);
}
/*
|--------------------------------------------------------------------------
| CURRENT LIVE ROUND
|--------------------------------------------------------------------------
*/
router.get("/aviator/current", async (_req, res) => {
    try {
        let round = await GameRound_1.GameRound.findOne({
            status: "RUNNING",
        }).sort({
            startedAt: -1,
        });
        if (!round) {
            round =
                await createContinuousRound();
        }
        const multiplier = Math.min(calculateMultiplier(round.startedAt), Number(round.crashPoint));
        return res.json({
            status: "RUNNING",
            multiplier,
            round: {
                _id: round._id,
                roundNumber: round.roundNumber,
                status: round.status,
                startedAt: round.startedAt,
            },
        });
    }
    catch (error) {
        console.error("Aviator current round error:", error);
        return res.status(500).json({
            message: "Could not load current round",
        });
    }
});
/*
|--------------------------------------------------------------------------
| JOIN CURRENT ROUND
|--------------------------------------------------------------------------
*/
router.post("/aviator/start", async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        const amount = Number(req.body?.amount);
        if (!Number.isFinite(amount) ||
            amount <= 0) {
            return res.status(400).json({
                message: "Enter a valid bet amount.",
            });
        }
        const roundedAmount = Number(amount.toFixed(2));
        const round = await GameRound_1.GameRound.findOne({
            status: "RUNNING",
        }).sort({
            startedAt: -1,
        });
        if (!round) {
            return res.status(409).json({
                message: "No live round is available.",
            });
        }
        const existingBet = await Transaction_1.Transaction.findOne({
            userId: req.user,
            type: "BET",
            reference: `AVIATOR_BET_${round._id}_${req.user}`,
        });
        if (existingBet) {
            return res.status(409).json({
                message: "You already joined this round.",
            });
        }
        session.startTransaction();
        const user = await User_1.User.findById(req.user).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({
                message: "User not found.",
            });
        }
        const currentBalance = Number(user.balance || 0);
        if (roundedAmount >
            currentBalance) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Insufficient balance.",
            });
        }
        user.balance = Number((currentBalance -
            roundedAmount).toFixed(2));
        await user.save({
            session,
        });
        await Transaction_1.Transaction.create([
            {
                userId: req.user,
                type: "BET",
                amount: roundedAmount,
                status: "APPROVED",
                reference: `AVIATOR_BET_${round._id}_${req.user}`,
                description: `Aviator Round #${round.roundNumber}`,
            },
        ], {
            session,
        });
        await session.commitTransaction();
        return res.json({
            message: "Joined live round.",
            round: {
                id: String(round._id),
                roundNumber: round.roundNumber,
                startedAt: round.startedAt,
            },
            balance: user.balance,
        });
    }
    catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error("Aviator join round error:", error);
        return res.status(500).json({
            message: "Could not join the round.",
        });
    }
    finally {
        await session.endSession();
    }
});
/*
|--------------------------------------------------------------------------
| ROUND STATUS
|--------------------------------------------------------------------------
*/
router.get("/aviator/:roundId", async (req, res) => {
    try {
        const round = await GameRound_1.GameRound.findById(req.params.roundId);
        if (!round) {
            return res.status(404).json({
                message: "Round not found.",
            });
        }
        if (round.status ===
            "CRASHED") {
            return res.json({
                status: "CRASHED",
                multiplier: Number(round.crashPoint),
                round: {
                    _id: round._id,
                    roundNumber: round.roundNumber,
                    crashPoint: round.crashPoint,
                    status: round.status,
                    startedAt: round.startedAt,
                    crashedAt: round.crashedAt,
                },
            });
        }
        const multiplier = calculateMultiplier(round.startedAt);
        if (multiplier >=
            Number(round.crashPoint)) {
            await crashCurrentRound(round);
            return res.json({
                status: "CRASHED",
                multiplier: Number(round.crashPoint),
                round: {
                    _id: round._id,
                    roundNumber: round.roundNumber,
                    crashPoint: round.crashPoint,
                    status: "CRASHED",
                    startedAt: round.startedAt,
                    crashedAt: new Date(),
                },
            });
        }
        return res.json({
            status: "RUNNING",
            multiplier,
            round: {
                _id: round._id,
                roundNumber: round.roundNumber,
                status: round.status,
                startedAt: round.startedAt,
            },
        });
    }
    catch (error) {
        console.error("Aviator status error:", error);
        return res.status(500).json({
            message: "Could not load round status.",
        });
    }
});
/*
|--------------------------------------------------------------------------
| CASH OUT
|--------------------------------------------------------------------------
*/
router.post("/aviator/:roundId/cashout", async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        const round = await GameRound_1.GameRound.findById(req.params.roundId);
        if (!round) {
            return res.status(404).json({
                message: "Round not found.",
            });
        }
        const bet = await Transaction_1.Transaction.findOne({
            userId: req.user,
            type: "BET",
            reference: `AVIATOR_BET_${round._id}_${req.user}`,
            status: "APPROVED",
        });
        if (!bet) {
            return res.status(400).json({
                message: "No active bet found for this round.",
            });
        }
        if (round.status !==
            "RUNNING") {
            return res.status(400).json({
                message: "Round has already crashed.",
            });
        }
        const multiplier = calculateMultiplier(round.startedAt);
        if (multiplier >=
            Number(round.crashPoint)) {
            await crashCurrentRound(round);
            return res.status(400).json({
                message: "Too late. The round crashed.",
            });
        }
        const finalMultiplier = Math.max(1.01, Number(multiplier.toFixed(2)));
        const payout = Number((Number(bet.amount) *
            finalMultiplier).toFixed(2));
        session.startTransaction();
        const lockedBet = await Transaction_1.Transaction.findOne({
            _id: bet._id,
            status: "APPROVED",
        }).session(session);
        if (!lockedBet) {
            await session.abortTransaction();
            return res.status(409).json({
                message: "This bet has already been processed.",
            });
        }
        lockedBet.status =
            "REJECTED";
        lockedBet.description =
            `${lockedBet.description || ""} | Cashed out at ${finalMultiplier.toFixed(2)}x`;
        await lockedBet.save({
            session,
        });
        const user = await User_1.User.findById(req.user).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({
                message: "User not found.",
            });
        }
        user.balance = Number((Number(user.balance || 0) +
            payout).toFixed(2));
        await user.save({
            session,
        });
        await Transaction_1.Transaction.create([
            {
                userId: req.user,
                type: "WIN",
                amount: payout,
                status: "APPROVED",
                reference: `AVIATOR_WIN_${round._id}_${req.user}_${Date.now()}`,
                description: `Aviator Round #${round.roundNumber} cashout at ${finalMultiplier.toFixed(2)}x`,
            },
        ], {
            session,
        });
        await session.commitTransaction();
        return res.json({
            message: "Cashed out successfully.",
            status: "WIN",
            multiplier: finalMultiplier,
            payout,
            balance: user.balance,
        });
    }
    catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error("Aviator cashout error:", error);
        return res.status(500).json({
            message: "Could not cash out.",
        });
    }
    finally {
        await session.endSession();
    }
});
/*
|--------------------------------------------------------------------------
| ROUND HISTORY
|--------------------------------------------------------------------------
*/
router.get("/aviator/history", async (_req, res) => {
    try {
        const rounds = await GameRound_1.GameRound.find({
            status: "CRASHED",
        })
            .sort({
            crashedAt: -1,
            createdAt: -1,
        })
            .limit(20)
            .select("roundNumber crashPoint status crashedAt")
            .lean();
        const history = rounds.map((round) => ({
            roundNumber: round.roundNumber,
            multiplier: Number(Number(round.crashPoint).toFixed(2)),
            crashedAt: round.crashedAt,
        }));
        return res.json({
            history,
        });
    }
    catch (error) {
        console.error("Aviator history error:", error);
        return res.status(500).json({
            message: "Could not load round history.",
        });
    }
});
void runRoundLoop();
exports.default = router;
