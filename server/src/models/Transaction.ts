import mongoose, { Document, Schema } from "mongoose";

export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "BET"
  | "WIN";

export type TransactionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "DEPOSIT",
        "WITHDRAWAL",
        "BET",
        "WIN",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    reference: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);