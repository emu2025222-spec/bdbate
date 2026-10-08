import { Router, Response } from "express";
import mongoose, { Schema, Document } from "mongoose";

import { Transaction } from "../models/Transaction";
import { User } from "../models/User";
import { GameRound } from "../models/GameRound";

import {
  AuthRequest,
  requireAdmin,
  requireAuth,
} from "../middleware/auth";

const router = Router();

/* =========================================================
   GAME SETTINGS
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
   GET / CREATE GAME SETTINGS
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

  if (
    typeof settings.maxCrashMultiplier !== "number" ||
    !Number.isFinite(settings.maxCrashMultiplier) ||
    settings.maxCrashMultiplier < 1
  ) {
    settings.maxCrashMultiplier = 20;
    await settings.save();
  }

  return settings;
}

/* =========================================================
   ADMIN DASHBOARD STATS
========================================================= */

router.get(
  "/dashboard",
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const [
        totalClients,
        pendingDeposits,
        pendingWithdrawals,
        totalBets,
        totalWins,
        totalLosses,
        latestTransactions,
        runningRound,
      ] = await Promise.all([
        User.countDocuments({
          role: "PLAYER",
        }),

        Transaction.countDocuments({
          type: "DEPOSIT",
          status: "PENDING",
        }),

        Transaction.countDocuments({
          type: "WITHDRAWAL",
          status: "PENDING",
        }),

        Transaction.countDocuments({
          type: "BET",
        }),

        Transaction.countDocuments({
          type: "WIN",
        }),

        Transaction.countDocuments({
          type: "BET",
          status: "REJECTED",
        }),

        Transaction.find()
          .populate(
            "userId",
            "name phone role balance"
          )
          .sort({
            createdAt: -1,
          })
          .limit(15),

        GameRound.findOne({
          status: "RUNNING",
        }).sort({
          startedAt: -1,
        }),
      ]);

      const balanceResult = await User.aggregate([
        {
          $match: {
            role: "PLAYER",
          },
        },

        {
          $group: {
            _id: null,

            totalBalance: {
              $sum: "$balance",
            },
          },
        },
      ]);

      const totalPlayerBalance =
        balanceResult.length > 0
          ? Number(
              balanceResult[0].totalBalance || 0
            )
          : 0;

      return res.json({
        stats: {
          totalClients,
          totalPlayerBalance,
          pendingDeposits,
          pendingWithdrawals,
          totalBets,
          totalWins,
          totalLosses,
        },

        game: {
          running: Boolean(runningRound),

          roundNumber:
            runningRound?.roundNumber || null,
        },

        latestTransactions,
      });
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load admin dashboard",
      });
    }
  }
);

/* =========================================================
   ALL CLIENTS
========================================================= */

router.get(
  "/clients",
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const clients = await User.find({
        role: "PLAYER",
      })
        .select("-passwordHash")
        .sort({
          createdAt: -1,
        });

      return res.json({
        clients,
        total: clients.length,
      });
    } catch (error) {
      console.error(
        "Admin clients error:",
        error
      );

      return res.status(500).json({
        message: "Failed to load clients",
      });
    }
  }
);

/* =========================================================
   EDIT CLIENT
   PUT /admin/clients/:id
========================================================= */

router.put(
  "/clients/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, phone } = req.body;

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid client ID",
        });
      }

      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          message: "Player name is required",
        });
      }

      if (
        typeof phone !== "string" ||
        !phone.trim()
      ) {
        return res.status(400).json({
          message:
            "Phone number is required",
        });
      }

      const client = await User.findOne({
        _id: req.params.id,
        role: "PLAYER",
      });

      if (!client) {
        return res.status(404).json({
          message: "Player not found",
        });
      }

      client.name = name.trim();
      client.phone = phone.trim();

      await client.save();

      const updatedClient =
        await User.findById(client._id)
          .select("-passwordHash");

      return res.json({
        message:
          "Player updated successfully",

        client: updatedClient,
      });
    } catch (error) {
      console.error(
        "Edit client error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update player",
      });
    }
  }
);

/* =========================================================
   BLOCK / UNBLOCK CLIENT
   PUT /admin/clients/:id/status
========================================================= */

router.put(
  "/clients/:id/status",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { isBlocked } = req.body;

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid client ID",
        });
      }

      if (
        typeof isBlocked !== "boolean"
      ) {
        return res.status(400).json({
          message:
            "isBlocked must be true or false",
        });
      }

      const client = await User.findOne({
        _id: req.params.id,
        role: "PLAYER",
      });

      if (!client) {
        return res.status(404).json({
          message: "Player not found",
        });
      }

      client.isBlocked = isBlocked;

      await client.save();

      return res.json({
        message: isBlocked
          ? "Player blocked successfully"
          : "Player unblocked successfully",

        client: {
          _id: client._id,
          name: client.name,
          phone: client.phone,
          role: client.role,
          balance: client.balance,
          isBlocked: client.isBlocked,
        },
      });
    } catch (error) {
      console.error(
        "Toggle client status error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update player status",
      });
    }
  }
);

/* =========================================================
   DELETE CLIENT
   DELETE /admin/clients/:id
========================================================= */

router.delete(
  "/clients/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid client ID",
        });
      }

      const client = await User.findOne({
        _id: req.params.id,
        role: "PLAYER",
      });

      if (!client) {
        return res.status(404).json({
          message: "Player not found",
        });
      }

      await User.deleteOne({
        _id: client._id,
        role: "PLAYER",
      });

      return res.json({
        message:
          "Player deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete client error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to delete player",
      });
    }
  }
);

/* =========================================================
   PENDING DEPOSIT REQUESTS
========================================================= */

router.get(
  "/credit-requests",
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const requests =
        await Transaction.find({
          type: "DEPOSIT",
          status: "PENDING",
        })
          .populate(
            "userId",
            "name phone balance"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        requests,
      });
    } catch (error) {
      console.error(
        "Admin credit requests error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load credit requests",
      });
    }
  }
);

/* =========================================================
   APPROVE DEPOSIT
========================================================= */

router.post(
  "/credit-requests/:id/approve",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const session =
      await mongoose.startSession();

    try {
      session.startTransaction();

      const transaction =
        await Transaction.findOne({
          _id: req.params.id,
          type: "DEPOSIT",
          status: "PENDING",
        }).session(session);

      if (!transaction) {
        await session.abortTransaction();

        return res.status(404).json({
          message:
            "Pending deposit request not found",
        });
      }

      const user =
        await User.findById(
          transaction.userId
        ).session(session);

      if (!user) {
        await session.abortTransaction();

        return res.status(404).json({
          message:
            "Player account not found",
        });
      }

      user.balance += transaction.amount;

      transaction.status = "APPROVED";

      transaction.description =
        "Deposit request approved by admin";

      await user.save({
        session,
      });

      await transaction.save({
        session,
      });

      await session.commitTransaction();

      return res.json({
        message:
          "Deposit request approved",

        balance: user.balance,

        transaction,
      });
    } catch (error) {
      await session.abortTransaction();

      console.error(
        "Approve deposit request error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to approve deposit request",
      });
    } finally {
      await session.endSession();
    }
  }
);

/* =========================================================
   REJECT DEPOSIT
========================================================= */

router.post(
  "/credit-requests/:id/reject",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const transaction =
        await Transaction.findOne({
          _id: req.params.id,
          type: "DEPOSIT",
          status: "PENDING",
        });

      if (!transaction) {
        return res.status(404).json({
          message:
            "Pending deposit request not found",
        });
      }

      transaction.status = "REJECTED";

      transaction.description =
        "Deposit request rejected by admin";

      await transaction.save();

      return res.json({
        message:
          "Deposit request rejected",

        transaction,
      });
    } catch (error) {
      console.error(
        "Reject deposit request error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to reject deposit request",
      });
    }
  }
);

/* =========================================================
   PENDING WITHDRAWAL REQUESTS
========================================================= */

router.get(
  "/withdrawal-requests",
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const requests =
        await Transaction.find({
          type: "WITHDRAWAL",
          status: "PENDING",
        })
          .populate(
            "userId",
            "name phone balance"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        requests,
      });
    } catch (error) {
      console.error(
        "Admin withdrawal requests error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load withdrawal requests",
      });
    }
  }
);

/* =========================================================
   APPROVE WITHDRAWAL
========================================================= */

router.post(
  "/withdrawal-requests/:id/approve",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const session =
      await mongoose.startSession();

    try {
      session.startTransaction();

      const transaction =
        await Transaction.findOne({
          _id: req.params.id,
          type: "WITHDRAWAL",
          status: "PENDING",
        }).session(session);

      if (!transaction) {
        await session.abortTransaction();

        return res.status(404).json({
          message:
            "Pending withdrawal request not found",
        });
      }

      const user =
        await User.findOne({
          _id: transaction.userId,

          balance: {
            $gte: transaction.amount,
          },
        }).session(session);

      if (!user) {
        await session.abortTransaction();

        return res.status(400).json({
          message:
            "Insufficient player balance",
        });
      }

      user.balance -= transaction.amount;

      transaction.status = "APPROVED";

      transaction.description =
        "Withdrawal request approved by admin";

      await user.save({
        session,
      });

      await transaction.save({
        session,
      });

      await session.commitTransaction();

      return res.json({
        message:
          "Withdrawal request approved",

        balance: user.balance,

        transaction,
      });
    } catch (error) {
      await session.abortTransaction();

      console.error(
        "Approve withdrawal request error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to approve withdrawal request",
      });
    } finally {
      await session.endSession();
    }
  }
);

/* =========================================================
   REJECT WITHDRAWAL
========================================================= */

router.post(
  "/withdrawal-requests/:id/reject",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const transaction =
        await Transaction.findOne({
          _id: req.params.id,
          type: "WITHDRAWAL",
          status: "PENDING",
        });

      if (!transaction) {
        return res.status(404).json({
          message:
            "Pending withdrawal request not found",
        });
      }

      transaction.status = "REJECTED";

      transaction.description =
        "Withdrawal request rejected by admin";

      await transaction.save();

      return res.json({
        message:
          "Withdrawal request rejected",

        transaction,
      });
    } catch (error) {
      console.error(
        "Reject withdrawal request error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to reject withdrawal request",
      });
    }
  }
);

/* =========================================================
   EDIT TRANSACTION
   PUT /admin/transactions/:id
========================================================= */

router.put(
  "/transactions/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        type,
        amount,
        status,
        reference,
        description,
      } = req.body;

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid transaction ID",
        });
      }

      const transaction =
        await Transaction.findById(
          req.params.id
        );

      if (!transaction) {
        return res.status(404).json({
          message:
            "Transaction not found",
        });
      }

      /* -------------------------
         TYPE
      ------------------------- */

      if (type !== undefined) {
        const allowedTypes = [
          "DEPOSIT",
          "WITHDRAWAL",
          "BET",
          "WIN",
        ];

        if (
          !allowedTypes.includes(type)
        ) {
          return res.status(400).json({
            message:
              "Invalid transaction type",
          });
        }

        transaction.type = type;
      }

      /* -------------------------
         AMOUNT
      ------------------------- */

      if (amount !== undefined) {
        const numericAmount =
          Number(amount);

        if (
          !Number.isFinite(
            numericAmount
          ) ||
          numericAmount < 0
        ) {
          return res.status(400).json({
            message:
              "Invalid transaction amount",
          });
        }

        transaction.amount =
          numericAmount;
      }

      /* -------------------------
         STATUS
      ------------------------- */

      if (status !== undefined) {
        const allowedStatuses = [
          "PENDING",
          "APPROVED",
          "REJECTED",
        ];

        if (
          !allowedStatuses.includes(
            status
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid transaction status",
          });
        }

        transaction.status =
          status;
      }

      /* -------------------------
         REFERENCE
      ------------------------- */

      if (reference !== undefined) {
        transaction.reference =
          String(reference).trim();
      }

      /* -------------------------
         DESCRIPTION
      ------------------------- */

      if (
        description !== undefined
      ) {
        transaction.description =
          String(description).trim();
      }

      await transaction.save();

      const updatedTransaction =
        await Transaction.findById(
          transaction._id
        ).populate(
          "userId",
          "name phone role balance"
        );

      return res.json({
        message:
          "Transaction updated successfully",

        transaction:
          updatedTransaction,
      });
    } catch (error) {
      console.error(
        "Edit transaction error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update transaction",
      });
    }
  }
);

/* =========================================================
   DELETE TRANSACTION
   DELETE /admin/transactions/:id
========================================================= */

router.delete(
  "/transactions/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid transaction ID",
        });
      }

      const transaction =
        await Transaction.findById(
          req.params.id
        );

      if (!transaction) {
        return res.status(404).json({
          message:
            "Transaction not found",
        });
      }

      await Transaction.deleteOne({
        _id: transaction._id,
      });

      return res.json({
        message:
          "Transaction deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete transaction error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to delete transaction",
      });
    }
  }
);

/* =========================================================
   RECENT TRANSACTIONS
========================================================= */

router.get(
  "/transactions",
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const transactions =
        await Transaction.find()
          .populate(
            "userId",
            "name phone role balance"
          )
          .sort({
            createdAt: -1,
          })
          .limit(200);

      return res.json({
        transactions,
      });
    } catch (error) {
      console.error(
        "Admin transactions error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load transactions",
      });
    }
  }
);

/* =========================================================
   GAME STATUS
========================================================= */

router.get(
  "/game-status",
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const [
        settings,
        runningRound,
        latestRounds,
      ] = await Promise.all([
        getGameSettings(),

        GameRound.findOne({
          status: "RUNNING",
        }).sort({
          startedAt: -1,
        }),

        GameRound.find()
          .sort({
            createdAt: -1,
          })
          .limit(20)
          .select(
            "roundNumber status startedAt crashedAt crashPoint"
          ),
      ]);

      return res.json({
        enabled:
          settings.enabled,

        maintenance:
          settings.maintenance,

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

        running:
          Boolean(runningRound),

        currentRound: runningRound
          ? {
              id: runningRound._id,

              roundNumber:
                runningRound.roundNumber,

              status:
                runningRound.status,

              startedAt:
                runningRound.startedAt,
            }
          : null,

        latestRounds,
      });
    } catch (error) {
      console.error(
        "Admin game status error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load game status",
      });
    }
  }
);

/* =========================================================
   UPDATE GAME SETTINGS
========================================================= */

router.put(
  "/game-settings",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        enabled,
        maintenance,
        minBet,
        maxBet,
        waitingTime,
        maxCrashMultiplier,
      } = req.body;

      const settings =
        await getGameSettings();

      /* -------------------------
         ENABLED
      ------------------------- */

      if (enabled !== undefined) {
        settings.enabled =
          Boolean(enabled);
      }

      /* -------------------------
         MAINTENANCE
      ------------------------- */

      if (
        maintenance !== undefined
      ) {
        settings.maintenance =
          Boolean(maintenance);
      }

      /* -------------------------
         MIN BET
      ------------------------- */

      if (minBet !== undefined) {
        const value =
          Number(minBet);

        if (
          !Number.isFinite(value) ||
          value < 0
        ) {
          return res.status(400).json({
            message:
              "Invalid minimum bet",
          });
        }

        settings.minBet = value;
      }

      /* -------------------------
         MAX BET
      ------------------------- */

      if (maxBet !== undefined) {
        const value =
          Number(maxBet);

        if (
          !Number.isFinite(value) ||
          value <= 0
        ) {
          return res.status(400).json({
            message:
              "Invalid maximum bet",
          });
        }

        settings.maxBet = value;
      }

      if (
        settings.minBet >
        settings.maxBet
      ) {
        return res.status(400).json({
          message:
            "Minimum bet cannot be greater than maximum bet",
        });
      }

      /* -------------------------
         WAITING TIME
      ------------------------- */

      if (
        waitingTime !== undefined
      ) {
        const value =
          Number(waitingTime);

        if (
          !Number.isFinite(value) ||
          value < 1 ||
          value > 60
        ) {
          return res.status(400).json({
            message:
              "Waiting time must be between 1 and 60 seconds",
          });
        }

        settings.waitingTime =
          value;
      }

      /* -------------------------
         MAX CRASH MULTIPLIER
      ------------------------- */

      if (
        maxCrashMultiplier !==
        undefined
      ) {
        const value =
          Number(
            maxCrashMultiplier
          );

        if (
          !Number.isFinite(value) ||
          value < 1 ||
          value > 1000
        ) {
          return res.status(400).json({
            message:
              "Maximum crash multiplier must be between 1x and 1000x",
          });
        }

        settings.maxCrashMultiplier =
          Math.round(
            value * 100
          ) / 100;
      }

      await settings.save();

      return res.json({
        message:
          "Game settings updated successfully",

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
        "Update game settings error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update game settings",
      });
    }
  }
);

export default router;