export type UserRole = "PLAYER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  balance: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Transaction {
  _id: string;
  userId: string;

  type:
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "BET"
    | "WIN";

  amount: number;

  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

  reference: string;

  description?: string;

  createdAt: string;

  updatedAt: string;
}