import { Router, Response } from "express";
import mongoose, { Document, Schema } from "mongoose";

import { AuthRequest, requireAuth } from "../middleware/auth";
import { User } from "../models/User";
import { Transaction } from "../models/Transaction";
import { GameRound } from "../models/GameRound";

const router = Router();

/* =========================================================
   GAME SETTINGS MODEL
========================================================= */

interface IGameSettings extends Document {
  enabled: boolean;
  maintenance: boolean;
  minBet: number;
  maxBet: number;
  waitingTime: number;
  maxCrashMultiplier: number;
  updatedAt: Date;
}

const gameSettingsSchema = new Schema<IGameSettings>(
  {
    enabled: {
      type: Boolean,
      default: true,
    },

    maintenance: {
      type: Boolean,
      default: false,
    },

    minBet: {
      type: Number,
      default: 10,
      min: 0,
    },

    maxBet: {
      type: Number,
      default: 10000,
      min: 0,
    },

    waitingTime: {
      type: Number,
      default: 10,
      min: 1,
      max: 60,
    },

    /*
     * Global maximum crash multiplier.
     *
     * Minimum possible crash remains 1.00x.
     * Admin can control this value from game settings.
     */
    maxCrashMultiplier: {
      type: Number,
      default: 20,
      min: 1,
      max: 1000,
    },
  },
  {
    timestamps: true,
  }
);

const GameSettings =
  mongoose.models.GameSettings ||
  mongoose.model<IGameSettings>(
    "GameSettings",
    gameSettingsSchema
  );

/* =========================================================
   SETTINGS
========================================================= */

const ROUND_TICK_MS = 100;

let creatingRound = false;

let nextRoundAt: number | null = null;

/* =========================================================
   GET GAME SETTINGS
========================================================= */

async function getGameSettings() {
  let settings = await GameSettings.findOne();

  if (!settings) {
    settings = await GameSettings.create({
      enabled: true,
      maintenance: false,
      minBet: 10,
      maxBet: 10000,
      waitingTime: 10,
      maxCrashMultiplier: 20,
    });
  }

  /*
   * Existing database documents may not have the new field.
   */
  if (
    !Number.isFinite(
      Number(settings.maxCrashMultiplier)
    )
  ) {
    settings.maxCrashMultiplier = 20;
    await settings.save();
  }

  return settings;
}

/* =========================================================
   HELPERS
========================================================= */

function validObjectId(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    mongoose.isValidObjectId(value)
  );
}

/* =========================================================
   CRASH POINT GENERATOR
========================================================= */

function getCrashPoint(
  maxCrashMultiplier: number
): number {
  /*
   * Minimum crash is always 1.00x.
   */
  const max = Math.max(
    1,
    Math.min(
      1000,
      Number(maxCrashMultiplier) || 20
    )
  );

  /*
   * If Admin sets maximum to 1x,
   * the round can only crash at 1.00x.
   */
  if (max <= 1) {
    return 1;
  }

  const random = Math.random();

  let crashPoint: number;

  if (random < 0.03) {
    crashPoint = 1;
  } else if (random < 0.1) {
    crashPoint =
      1 + Math.random() * 0.5;
  } else if (random < 0.35) {
    crashPoint =
      1.5 + Math.random() * 1.5;
  } else if (random < 0.75) {
    crashPoint =
      2.5 + Math.random() * 3.5;
  } else {
    /*
     * Higher random range.
     */
    crashPoint =
      6 + Math.random() * Math.max(0, max - 6);
  }

  /*
   * IMPORTANT:
   * Never allow the generated crash point
   * to go above Admin's configured maximum.
   */
  crashPoint = Math.min(
    crashPoint,
    max
  );

  /*
   * Never go below 1.00x.
   */
  crashPoint = Math.max(
    1,
    crashPoint
  );

  return Number(
    crashPoint.toFixed(2)
  );
}

function calculateMultiplier(
  startedAt: Date
): number {
  const elapsed =
    Math.max(
      0,
      Date.now() - startedAt.getTime()
    ) / 1000;

  const multiplier =
    1 +
    elapsed * 0.18 +
    elapsed * elapsed * 0.018;

  return Number(
    multiplier.toFixed(2)
  );
}

/* =========================================================
   CLEAN OLD AVIATOR BET
========================================================= */

async function cleanupOldBet(
  userId: string
) {
  const activeBet =
    await Transaction.findOne({
      userId,
      type: "BET",
      status: "APPROVED",
      reference: {
        $regex:
          /^AVIATOR_(BET_|QUEUED_)/,
      },
    });

  if (!activeBet) {
    return null;
  }

  const reference =
    activeBet.reference;

  if (
    reference.startsWith(
      "AVIATOR_QUEUED_"
    )
  ) {
    if (
      nextRoundAt === null ||
      Date.now() < nextRoundAt
    ) {
      return activeBet;
    }

    activeBet.status =
      "REJECTED";

    activeBet.description =
      "Aviator queued bet expired.";

    await activeBet.save();

    return null;
  }

  const parts =
    reference.split("_");

  const roundId =
    parts[2];

  if (!validObjectId(roundId)) {
    activeBet.status =
      "REJECTED";

    activeBet.description =
      "Invalid Aviator round reference.";

    await activeBet.save();

    return null;
  }

  const round =
    await GameRound.findById(
      roundId
    );

  if (!round) {
    activeBet.status =
      "REJECTED";

    activeBet.description =
      "Stale Aviator bet.";

    await activeBet.save();

    return null;
  }

  if (
    round.status ===
    "CRASHED"
  ) {
    activeBet.status =
      "REJECTED";

    activeBet.description =
      `Lost at ${round.crashPoint.toFixed(
        2
      )}x`;

    await activeBet.save();

    return null;
  }

  return activeBet;
}

/* =========================================================
   PROMOTE QUEUED BETS
========================================================= */

async function promoteQueuedBets(
  round: any
) {
  const queued =
    await Transaction.find({
      type: "BET",
      status: "APPROVED",
      reference: {
        $regex:
          /^AVIATOR_QUEUED_/,
      },
    });

  for (const transaction of queued) {
    try {
      const parts =
        transaction.reference.split("_");

      const userId =
        parts[2];

      if (
        !validObjectId(userId)
      ) {
        transaction.status =
          "REJECTED";

        transaction.description =
          "Invalid queued Aviator bet.";

        await transaction.save();

        continue;
      }

      const alreadyBet =
        await Transaction.findOne({
          userId:
            transaction.userId,
          type: "BET",
          status: "APPROVED",
          reference:
            `AVIATOR_BET_${round._id}_${userId}`,
        });

      if (alreadyBet) {
        transaction.status =
          "REJECTED";

        transaction.description =
          "Duplicate Aviator bet.";

        await transaction.save();

        continue;
      }

      transaction.reference =
        `AVIATOR_BET_${round._id}_${userId}`;

      transaction.description =
        `Aviator Round #${round.roundNumber}`;

      await transaction.save();
    } catch (error) {
      console.error(
        "Queued bet promotion error:",
        error
      );
    }
  }
}

/* =========================================================
   CREATE CONTINUOUS ROUND
========================================================= */

async function createContinuousRound() {
  const settings =
    await getGameSettings();

  if (
    !settings.enabled ||
    settings.maintenance
  ) {
    return null;
  }

  const existing =
    await GameRound.findOne({
      status: "RUNNING",
    }).sort({
      roundNumber: -1,
    });

  if (existing) {
    return existing;
  }

  if (
    nextRoundAt !== null &&
    Date.now() < nextRoundAt
  ) {
    return null;
  }

  if (creatingRound) {
    return null;
  }

  creatingRound = true;

  try {
    const running =
      await GameRound.findOne({
        status: "RUNNING",
      }).sort({
        roundNumber: -1,
      });

    if (running) {
      return running;
    }

    const lastRound =
      await GameRound.findOne()
        .sort({
          roundNumber: -1,
        })
        .lean();

    const nextNumber =
      (lastRound?.roundNumber || 0) + 1;

    let round: any = null;

    for (
      let attempt = 0;
      attempt < 5;
      attempt++
    ) {
      try {
        const number =
          nextNumber + attempt;

        round =
          await GameRound.create({
            roundNumber: number,

            /*
             * Random crash point,
             * limited by Admin maximum.
             */
            crashPoint:
              getCrashPoint(
                settings.maxCrashMultiplier
              ),

            status: "RUNNING",

            startedAt:
              new Date(),
          });

        break;
      } catch (error: any) {
        if (
          error?.code === 11000
        ) {
          const running =
            await GameRound.findOne({
              status: "RUNNING",
            }).sort({
              roundNumber: -1,
            });

          if (running) {
            round = running;
            break;
          }

          continue;
        }

        throw error;
      }
    }

    if (!round) {
      return null;
    }

    nextRoundAt = null;

    await promoteQueuedBets(
      round
    );

    return round;
  } finally {
    creatingRound = false;
  }
}

/* =========================================================
   CRASH CURRENT ROUND
========================================================= */

async function crashCurrentRound(
  round: any
) {
  if (
    !round ||
    round.status !== "RUNNING"
  ) {
    return;
  }

  const freshRound =
    await GameRound.findById(
      round._id
    );

  if (
    !freshRound ||
    freshRound.status !== "RUNNING"
  ) {
    return;
  }

  freshRound.status =
    "CRASHED";

  freshRound.crashedAt =
    new Date();

  await freshRound.save();

  const settings =
    await getGameSettings();

  const waitingTime =
    Math.max(
      1,
      Math.min(
        60,
        Number(
          settings.waitingTime || 10
        )
      )
    );

  nextRoundAt =
    Date.now() +
    waitingTime * 1000;

  const activeBets =
    await Transaction.find({
      type: "BET",
      status: "APPROVED",
      reference: {
        $regex:
          new RegExp(
            `^AVIATOR_BET_${freshRound._id}_`
          ),
      },
    });

  for (const bet of activeBets) {
    bet.status =
      "REJECTED";

    bet.description =
      `Lost at ${freshRound.crashPoint.toFixed(
        2
      )}x`;

    await bet.save();
  }
}

/* =========================================================
   ROUND LOOP
========================================================= */

async function runRoundLoop() {
  try {
    const settings =
      await getGameSettings();

    if (
      !settings.enabled ||
      settings.maintenance
    ) {
      return;
    }

    let round =
      await GameRound.findOne({
        status: "RUNNING",
      }).sort({
        roundNumber: -1,
      });

    if (!round) {
      if (
        nextRoundAt === null ||
        Date.now() >= nextRoundAt
      ) {
        round =
          await createContinuousRound();
      }
    }

    if (!round) {
      return;
    }

    if (
      round.status !== "RUNNING"
    ) {
      return;
    }

    const multiplier =
      calculateMultiplier(
        round.startedAt
      );

    if (
      multiplier >=
      round.crashPoint
    ) {
      await crashCurrentRound(
        round
      );
    }
  } catch (error) {
    console.error(
      "Aviator loop error:",
      error
    );
  }
}

setInterval(
  runRoundLoop,
  ROUND_TICK_MS
);

/* =========================================================
   CURRENT ROUND
========================================================= */

router.get(
  "/aviator/current",
  requireAuth,
  async (
    _req: AuthRequest,
    res: Response
  ) => {
    try {
      const settings =
        await getGameSettings();

      if (
        !settings.enabled ||
        settings.maintenance
      ) {
        return res.json({
          status: "DISABLED",
          multiplier: 1,
          countdownMs: 0,
          round: null,

          settings: {
            enabled:
              settings.enabled,

            maintenance:
              settings.maintenance,

            minBet:
              settings.minBet,

            maxBet:
              settings.maxBet,

            waitingTime:
              settings.waitingTime,

            maxCrashMultiplier:
              settings.maxCrashMultiplier,
          },
        });
      }

      const round =
        await GameRound.findOne({
          status: "RUNNING",
        }).sort({
          roundNumber: -1,
        });

      if (!round) {
        let remaining = 0;

        if (
          nextRoundAt !== null
        ) {
          remaining =
            Math.max(
              0,
              nextRoundAt -
                Date.now()
            );
        }

        return res.json({
          status: "WAITING",
          multiplier: 1,
          countdownMs:
            remaining,
          round: null,

          settings: {
            enabled:
              settings.enabled,

            maintenance:
              settings.maintenance,

            minBet:
              settings.minBet,

            maxBet:
              settings.maxBet,

            waitingTime:
              settings.waitingTime,

            maxCrashMultiplier:
              settings.maxCrashMultiplier,
          },
        });
      }

      const multiplier =
        Math.min(
          calculateMultiplier(
            round.startedAt
          ),
          round.crashPoint
        );

      return res.json({
        status: "RUNNING",

        multiplier,

        round: {
          _id:
            round._id.toString(),

          roundNumber:
            round.roundNumber,

          status:
            round.status,

          startedAt:
            round.startedAt,
        },

        settings: {
          enabled:
            settings.enabled,

          maintenance:
            settings.maintenance,

          minBet:
            settings.minBet,

          maxBet:
            settings.maxBet,

          waitingTime:
            settings.waitingTime,

          maxCrashMultiplier:
            settings.maxCrashMultiplier,
        },
      });
    } catch (error) {
      console.error(
        "Current Aviator error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load current Aviator round.",
      });
    }
  }
);

/* =========================================================
   PLACE AVIATOR BET
========================================================= */

router.post(
  "/aviator/start",
  requireAuth,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.user?.id;

      if (
        !userId ||
        !validObjectId(userId)
      ) {
        return res.status(400).json({
          message:
            "Invalid user authentication.",
        });
      }

      const settings =
        await getGameSettings();

      if (!settings.enabled) {
        return res.status(403).json({
          message:
            "Aviator game is currently disabled.",
        });
      }

      if (settings.maintenance) {
        return res.status(503).json({
          message:
            "Aviator is currently under maintenance.",
        });
      }

      const amount =
        Number(
          req.body?.amount
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid bet amount.",
        });
      }

      if (
        amount <
        settings.minBet
      ) {
        return res.status(400).json({
          message:
            `Minimum bet is ${settings.minBet} credits.`,
        });
      }

      if (
        amount >
        settings.maxBet
      ) {
        return res.status(400).json({
          message:
            `Maximum bet is ${settings.maxBet} credits.`,
        });
      }

      const existingBet =
        await cleanupOldBet(
          userId
        );

      if (existingBet) {
        return res.status(400).json({
          message:
            "You already have an Aviator bet.",
        });
      }

      const user =
        await User.findOneAndUpdate(
          {
            _id: userId,
            balance: {
              $gte: amount,
            },
          },
          {
            $inc: {
              balance: -amount,
            },
          },
          {
            new: true,
          }
        );

      if (!user) {
        const account =
          await User.findById(
            userId
          );

        if (!account) {
          return res.status(400).json({
            message:
              "User account not found.",
          });
        }

        return res.status(400).json({
          message:
            "Insufficient balance.",
        });
      }

      let currentRound =
        await GameRound.findOne({
          status: "RUNNING",
        }).sort({
          roundNumber: -1,
        });

      if (currentRound) {
        const transaction =
          await Transaction.create({
            userId:
              user._id,

            type: "BET",

            amount,

            status:
              "APPROVED",

            reference:
              `AVIATOR_QUEUED_${userId}_${Date.now()}`,

            description:
              "Aviator bet queued for next round",
          });

        return res.json({
          message:
            "Bet queued for next round.",

          queued: true,

          transactionId:
            transaction._id.toString(),

          balance:
            user.balance,

          round: {
            id:
              currentRound._id.toString(),

            roundNumber:
              currentRound.roundNumber +
              1,

            startedAt:
              new Date().toISOString(),
          },
        });
      }

      currentRound =
        await createContinuousRound();

      if (!currentRound) {
        const transaction =
          await Transaction.create({
            userId:
              user._id,

            type: "BET",

            amount,

            status:
              "APPROVED",

            reference:
              `AVIATOR_QUEUED_${userId}_${Date.now()}`,

            description:
              "Aviator bet queued for next round",
          });

        return res.json({
          message:
            "Bet queued for next round.",

          queued: true,

          transactionId:
            transaction._id.toString(),

          balance:
            user.balance,

          round: null,
        });
      }

      const transaction =
        await Transaction.create({
          userId:
            user._id,

          type: "BET",

          amount,

          status:
            "APPROVED",

          reference:
            `AVIATOR_BET_${currentRound._id}_${userId}`,

          description:
            `Aviator Round #${currentRound.roundNumber}`,
        });

      return res.json({
        message:
          "Bet placed successfully.",

        queued: false,

        transactionId:
          transaction._id.toString(),

        balance:
          user.balance,

        round: {
          id:
            currentRound._id.toString(),

          roundNumber:
            currentRound.roundNumber,

          startedAt:
            currentRound.startedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error(
        "Aviator bet error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to place Aviator bet.",
      });
    }
  }
);

/* =========================================================
   HISTORY
========================================================= */

router.get(
  "/aviator/history",
  requireAuth,
  async (
    _req: AuthRequest,
    res: Response
  ) => {
    try {
      const rounds =
        await GameRound.find({
          status: "CRASHED",
        })
          .sort({
            roundNumber: -1,
          })
          .limit(20)
          .lean();

      return res.json({
        history:
          rounds.map(
            (round) => ({
              roundNumber:
                round.roundNumber,

              multiplier:
                round.crashPoint,

              crashedAt:
                round.crashedAt,
            })
          ),
      });
    } catch (error) {
      console.error(
        "Aviator history error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load Aviator history.",
      });
    }
  }
);

/* =========================================================
   ROUND STATUS
========================================================= */

router.get(
  "/aviator/:roundId",
  requireAuth,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const {
        roundId,
      } = req.params;

      if (
        !validObjectId(
          roundId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid round ID.",
        });
      }

      const round =
        await GameRound.findById(
          roundId
        );

      if (!round) {
        return res.status(404).json({
          message:
            "Round not found.",
        });
      }

      if (
        round.status ===
        "RUNNING"
      ) {
        const multiplier =
          Math.min(
            calculateMultiplier(
              round.startedAt
            ),
            round.crashPoint
          );

        return res.json({
          status:
            "RUNNING",

          multiplier,

          round: {
            _id:
              round._id.toString(),

            roundNumber:
              round.roundNumber,

            status:
              round.status,

            startedAt:
              round.startedAt,
          },
        });
      }

      return res.json({
        status:
          "CRASHED",

        multiplier:
          round.crashPoint,

        round: {
          _id:
            round._id.toString(),

          roundNumber:
            round.roundNumber,

          crashPoint:
            round.crashPoint,

          status:
            round.status,

          startedAt:
            round.startedAt,

          crashedAt:
            round.crashedAt,
        },
      });
    } catch (error) {
      console.error(
        "Aviator status error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load round status.",
      });
    }
  }
);

/* =========================================================
   CASH OUT
========================================================= */

router.post(
  "/aviator/:roundId/cashout",
  requireAuth,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.user?.id;

      const {
        roundId,
      } = req.params;

      if (
        !userId ||
        !validObjectId(userId)
      ) {
        return res.status(400).json({
          message:
            "Invalid user authentication.",
        });
      }

      if (
        !validObjectId(
          roundId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid round ID.",
        });
      }

      const round =
        await GameRound.findById(
          roundId
        );

      if (!round) {
        return res.status(404).json({
          message:
            "Round not found.",
        });
      }

      if (
        round.status !==
        "RUNNING"
      ) {
        return res.status(400).json({
          message:
            "This round has already crashed.",
        });
      }

      const bet =
        await Transaction.findOne({
          userId,

          type: "BET",

          status:
            "APPROVED",

          reference:
            `AVIATOR_BET_${round._id}_${userId}`,
        });

      if (!bet) {
        return res.status(400).json({
          message:
            "No active Aviator bet found.",
        });
      }

      const multiplier =
        Math.min(
          calculateMultiplier(
            round.startedAt
          ),
          round.crashPoint
        );

      if (
        multiplier >=
        round.crashPoint
      ) {
        return res.status(400).json({
          message:
            "Round crashed before cashout.",
        });
      }

      const settledBet =
        await Transaction.findOneAndUpdate(
          {
            _id: bet._id,
            status: "APPROVED",
          },
          {
            $set: {
              status:
                "REJECTED",

              description:
                `Cashed out at ${multiplier.toFixed(
                  2
                )}x`,
            },
          },
          {
            new: true,
          }
        );

      if (!settledBet) {
        return res.status(400).json({
          message:
            "This bet has already been settled.",
        });
      }

      const payout =
        Number(
          (
            Number(bet.amount) *
            multiplier
          ).toFixed(2)
        );

      const user =
        await User.findByIdAndUpdate(
          userId,
          {
            $inc: {
              balance: payout,
            },
          },
          {
            new: true,
          }
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found.",
        });
      }

      await Transaction.create({
        userId:
          user._id,

        type: "WIN",

        amount:
          payout,

        status:
          "APPROVED",

        reference:
          `AVIATOR_WIN_${round._id}_${userId}_${Date.now()}`,

        description:
          `Aviator payout at ${multiplier.toFixed(
            2
          )}x`,
      });

      return res.json({
        message:
          "Cashout successful.",

        status:
          "WIN",

        multiplier,

        payout,

        balance:
          user.balance,
      });
    } catch (error) {
      console.error(
        "Aviator cashout error:",
        error
      );

      return res.status(500).json({
        message:
          "Cashout failed.",
      });
    }
  }
);

export default router;