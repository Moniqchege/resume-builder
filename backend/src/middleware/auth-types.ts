import { Request } from "express";

export interface AuthRequest extends Request {
  userId?: number | string; 
  user?: {
    id: number | string;
    email: string;
    name: string;
    plan: string | null;
  };
}