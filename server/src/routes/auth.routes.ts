import { Router } from "express";
import bcrypt from "bcryptjs";

import { User } from "../models/User";
import { createToken } from "../utils/jwt";
import {
  AuthRequest,
  requireAuth,
} from "../middleware/auth";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        message: "Name, phone and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existing = await User.findOne({ phone });

    if (existing) {
      return res.status(409).json({
        message: "Phone number already registered",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const user = await User.create({
      name,
      phone,
      passwordHash,
      role: "PLAYER",
      balance: 0,
    });

    const token = createToken({
      id: user._id.toString(),
      role: user.role,
      email: user.phone,
    });

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      message: "Registration failed",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone and password are required",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(401).json({
        message: "Invalid phone or password",
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!valid) {
      return res.status(401).json({
        message: "Invalid phone or password",
      });
    }

    const token = createToken({
      id: user._id.toString(),
      role: user.role,
      email: user.phone,
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message: "Login failed",
    });
  }
});

router.get(
  "/me",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message:
            "Invalid authentication token",
        });
      }

      const user =
        await User.findById(
          userId
        ).select("-passwordHash");

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      return res.json({
        user: {
          id: user._id.toString(),
          name: user.name,
          phone: user.phone,
          role: user.role,
          balance: user.balance,
        },
      });
    } catch (error) {
      console.error(
        "Profile error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load profile",
      });
    }
  }
);

export default router;