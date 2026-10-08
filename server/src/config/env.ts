import dotenv from "dotenv";

dotenv.config();

const required = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
};

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: required("MONGO_URI"),
  jwtSecret: required("JWT_SECRET"),
};