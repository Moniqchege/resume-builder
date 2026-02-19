import { Request } from "express";

export interface AuthRequest extends Request {
  userId?: number; 
  user?: {
    id: number;
    email: string;
    name: string;
    plan: string | null;
  };
}