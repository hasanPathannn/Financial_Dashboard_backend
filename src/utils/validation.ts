import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).default('VIEWER'),
});

export const recordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1),
  notes: z.string().optional(),
  date: z.coerce.date().optional(),
});

export const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});