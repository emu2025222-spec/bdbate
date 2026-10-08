import { Router } from "express";
import {
  AuthRequest,
  requireAuth,
} from "../middleware/auth";

import { User } from "../models/User";
import { Transaction } from "../models/Transaction";

const router = Router();

router.use(requireAuth);

/*
|--------------------------------------------------------------------------
| Deposit Request
|--------------------------------------------------------------------------
*/
router.post(
  "/deposit-request",
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const { amount, reference } = req.body;

      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message: "Invalid amount",
        });
      }

      if (
        !reference ||
        String(reference).trim().length < 3
      ) {
        return res.status(400).json({
          message: "Reference is required",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const transaction = await Transaction.create({
        userId: user._id,
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
    } catch (error) {
      console.error("Deposit request error:", error);

      return res.status(500).json({
        message: "Could not create deposit request",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Withdraw Request
|--------------------------------------------------------------------------
*/
router.post(
  "/withdraw-request",
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const { amount, reference } = req.body;

      const numericAmount = Number(amount);

      /*
      |--------------------------------------------------------------------------
      | Amount validation
      |--------------------------------------------------------------------------
      */
      if (
        !Number.isFinite(numericAmount) ||
        numericAmount < 100
      ) {
        return res.status(400).json({
          message:
            "Minimum withdrawal request is 100 credits",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Reference / Number validation
      |--------------------------------------------------------------------------
      */
      const cleanReference =
        reference !== undefined &&
        reference !== null
          ? String(reference).trim()
          : "";

      if (cleanReference.length < 3) {
        return res.status(400).json({
          message:
            "Withdrawal number/reference is required",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Find player
      |--------------------------------------------------------------------------
      */
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Balance check
      |--------------------------------------------------------------------------
      */
      if (user.balance < numericAmount) {
        return res.status(400).json({
          message: "Insufficient balance",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Existing pending withdrawal
      |--------------------------------------------------------------------------
      */
      const existing =
        await Transaction.findOne({
          userId: user._id,
          type: "WITHDRAWAL",
          status: "PENDING",
        });

      if (existing) {
        return res.status(400).json({
          message:
            "You already have a pending withdrawal",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Create withdrawal transaction
      |--------------------------------------------------------------------------
      */
      const transaction =
        await Transaction.create({
          userId: user._id,
          type: "WITHDRAWAL",
          amount: numericAmount,
          status: "PENDING",
          reference: cleanReference,
          description:
            "Withdrawal request submitted by player",
        });

      return res.status(201).json({
        message:
          "Withdrawal request submitted successfully",
        transaction: {
          id: transaction._id,
          userId: transaction.userId,
          type: transaction.type,
          amount: transaction.amount,
          reference: transaction.reference,
          status: transaction.status,
          description: transaction.description,
          createdAt: transaction.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "Withdrawal request error:",
        error
      );

      return res.status(500).json({
        message:
          "Could not create withdrawal request",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Balance
|--------------------------------------------------------------------------
*/
router.get(
  "/balance",
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const user =
        await User.findById(userId).select(
          "name phone balance role"
        );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      return res.json({
        balance: user.balance,
        user,
      });
    } catch (error) {
      console.error(
        "Balance error:",
        error
      );

      return res.status(500).json({
        message: "Could not load balance",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Transactions
|--------------------------------------------------------------------------
*/
router.get(
  "/transactions",
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const transactions =
        await Transaction.find({
          userId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(100);

      return res.json({
        transactions,
      });
    } catch (error) {
      console.error(
        "Transactions error:",
        error
      );

      return res.status(500).json({
        message:
          "Could not load transactions",
      });
    }
  }
);

export default router;