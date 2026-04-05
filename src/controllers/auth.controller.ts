import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma, JWT_SECRET } from '../config/db';
import { registerSchema, userStatusSchema } from '../utils/validation';
import { AuthRequest } from '../middlewares/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) { res.status(400).json({ error: 'User already exists' }); return; }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, role: data.role, status: 'ACTIVE' },
    });
    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error: any) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(400).json({ error: 'Invalid email or password' }); return;
    }
    if (user.status === 'INACTIVE') {
      res.status(403).json({ error: 'Your account has been deactivated.' }); return;
    }

    const token = jwt.sign({ id: user.id, role: user.role, status: user.status }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: user.role, status: user.status });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status } = userStatusSchema.parse(req.body);
    const updatedUser = await prisma.user.update({
      where: { id }, data: { status }, select: { id: true, email: true, role: true, status: true }
    });
    res.json(updatedUser);
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ error: 'User not found' }); return; }
    res.status(400).json({ error: error.errors || error.message });
  }
};