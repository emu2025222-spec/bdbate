import axios from "axios";
import type { AuthResponse, Transaction, User } from "../types";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bd_best_betting_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function register(
  name: string,
  phone: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", {
    name,
    phone,
    password,
  });

  return response.data;
}

export async function login(
  phone: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", {
    phone,
    password,
  });

  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await api.get<{ user: User }>("/auth/me");

  return response.data.user;
}

export async function getBalance(): Promise<{
  balance: number;
  user: User;
}> {
  const response = await api.get<{
    balance: number;
    user: User;
  }>("/wallet/balance");

  return response.data;
}

export async function getTransactions(): Promise<Transaction[]> {
  const response = await api.get<{
    transactions: Transaction[];
  }>("/wallet/transactions");

  return response.data.transactions;
}

export async function createDepositRequest(
  amount: number,
  reference: string
) {
  const response = await api.post("/wallet/deposit-request", {
    amount,
    reference,
  });

  return response.data;
}

export async function createWithdrawRequest(
  amount: number,
  reference?: string
) {
  const response = await api.post("/wallet/withdraw-request", {
    amount,
    reference,
  });

  return response.data;
}

/* =========================================================
   AVIATOR
========================================================= */

export interface AviatorStartResponse {
  message: string;

  round: {
    id: string;
    roundNumber: number;
    startedAt: string;
  };

  balance: number;
}

export interface AviatorStatusResponse {
  status: "RUNNING" | "CRASHED";
  multiplier: number;

  round: {
    _id: string;
    roundNumber: number;
    crashPoint?: number;
    status: "RUNNING" | "CRASHED";
    startedAt: string;
    crashedAt?: string;
  };
}

export interface AviatorCashoutResponse {
  message: string;
  status: "WIN" | "CRASHED";
  multiplier: number;
  payout?: number;
  balance?: number;
}

export async function startAviatorRound(
  amount: number
): Promise<AviatorStartResponse> {
  const response =
    await api.post<AviatorStartResponse>(
      "/game/aviator/start",
      {
        amount,
      }
    );

  return response.data;
}

export async function getAviatorRoundStatus(
  roundId: string
): Promise<AviatorStatusResponse> {
  const response =
    await api.get<AviatorStatusResponse>(
      `/game/aviator/${roundId}`
    );

  return response.data;
}

export async function cashOutAviator(
  roundId: string
): Promise<AviatorCashoutResponse> {
  const response =
    await api.post<AviatorCashoutResponse>(
      `/game/aviator/${roundId}/cashout`
    );

  return response.data;
}

/* =========================================================
   ERROR HANDLER
========================================================= */

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "Something went wrong"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}
export interface AviatorHistoryItem {
  roundNumber: number;
  multiplier: number;
  crashedAt?: string;
}

export interface AviatorHistoryResponse {
  history: AviatorHistoryItem[];
}

export async function getAviatorHistory(): Promise<AviatorHistoryResponse> {
  const response = await api.get<AviatorHistoryResponse>(
    "/game/aviator/history"
  );

  return response.data;
}