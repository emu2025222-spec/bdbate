import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  phone: string;
  passwordHash: string;
  name: string;
  role: "PLAYER" | "ADMIN";
  balance: number;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["PLAYER", "ADMIN"],
      default: "PLAYER",
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", userSchema);