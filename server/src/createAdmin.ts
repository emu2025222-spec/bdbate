import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { User } from "./models/User";

dotenv.config();

async function createAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    const phone = process.env.ADMIN_PHONE;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "BD Best Admin";

    if (!phone) {
      throw new Error("ADMIN_PHONE is missing in .env");
    }

    if (!password) {
      throw new Error("ADMIN_PASSWORD is missing in .env");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const existingUser = await User.findOne({
      phone: phone.trim(),
    });

    const passwordHash = await bcrypt.hash(password, 12);

    if (existingUser) {
      existingUser.name = name.trim();
      existingUser.passwordHash = passwordHash;
      existingUser.role = "ADMIN";

      await existingUser.save();

      console.log("");
      console.log("=================================");
      console.log("ADMIN ACCOUNT UPDATED");
      console.log("=================================");
      console.log(`Name: ${existingUser.name}`);
      console.log(`Phone: ${existingUser.phone}`);
      console.log("Role: ADMIN");
      console.log("=================================");

      await mongoose.disconnect();
      return;
    }

    const admin = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      passwordHash,
      role: "ADMIN",
      balance: 0,
    });

    console.log("");
    console.log("=================================");
    console.log("ADMIN ACCOUNT CREATED");
    console.log("=================================");
    console.log(`Name: ${admin.name}`);
    console.log(`Phone: ${admin.phone}`);
    console.log("Role: ADMIN");
    console.log("=================================");

    await mongoose.disconnect();
  } catch (error) {
    console.error("");
    console.error("ADMIN SETUP FAILED");
    console.error(error);

    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect error
    }

    process.exit(1);
  }
}

createAdmin();