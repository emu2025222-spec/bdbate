import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  id: string;
  role: "PLAYER" | "ADMIN";
  email?: string;
}

export function createToken(
  payload: JwtPayload
): string {
  return jwt.sign(
    {
      id: payload.id,
      role: payload.role,
      email: payload.email,
    },
    env.jwtSecret,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyToken(
  token: string
): JwtPayload {
  return jwt.verify(
    token,
    env.jwtSecret
  ) as JwtPayload;
}