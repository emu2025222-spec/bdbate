import mongoose, { Document, Schema } from "mongoose";

export type GameRoundStatus =
  | "RUNNING"
  | "CRASHED";

export interface IGameRound extends Document {
  roundNumber: number;

  crashPoint: number;

  status: GameRoundStatus;

  startedAt: Date;

  crashedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}

const gameRoundSchema = new Schema<IGameRound>(
  {
    roundNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    crashPoint: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["RUNNING", "CRASHED"],
      default: "RUNNING",
      required: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    crashedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const GameRound = mongoose.model<IGameRound>(
  "GameRound",
  gameRoundSchema
);