import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-assessment-key';

app.use(cors());
app.use(express.json());

// ==========================================
// 1. VALIDATION SCHEMAS (Zod)
// ==========================================
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).default('VIEWER'),
});

const recordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1),
  notes: z.string().optional(),
  date: z.coerce.date().optional(), // Coerces input into a native JS Date object for Prisma
});

const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

// ==========================================
// 2. MIDDLEWARES (Auth & RBAC)
// ==========================================
interface AuthRequest extends Request {
  user?: { id: string; role: string; status: string };
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'Access denied. No token provided.' }); return; }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; status: string };
    if (decoded.status === 'INACTIVE') {
      res.status(403).json({ error: 'Account is inactive.' }); return;
    }
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
      return;
    }
    next();
  };
};

// ==========================================
// 3. USER & ROLE MANAGEMENT
// ==========================================
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
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
});

app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(400).json({ error: 'Invalid email or password' }); return;
    }

    if (user.status === 'INACTIVE') {
      res.status(403).json({ error: 'Your account has been deactivated.' }); return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, status: user.status }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );
    res.json({ token, role: user.role, status: user.status });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin can manage user status
app.put('/api/users/:id/status', [authenticate, authorize(['ADMIN'])], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id); // Fixed type for Prisma
    const { status } = userStatusSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, role: true, status: true }
    });
    
    res.json(updatedUser);
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ error: 'User not found' }); return; }
    res.status(400).json({ error: error.errors || error.message });
  }
});

// ==========================================
// 4. FINANCIAL RECORDS MANAGEMENT
// ==========================================
app.post('/api/records', [authenticate, authorize(['ADMIN'])], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = recordSchema.parse(req.body);
    const record = await prisma.record.create({
      data: { ...data, userId: req.user!.id },
    });
    res.status(201).json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.errors || error.message });
  }
});

app.get('/api/records', [authenticate, authorize(['ADMIN', 'ANALYST'])], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, category, startDate, endDate } = req.query;
    const filters: any = {};
    
    if (type) filters.type = String(type).toUpperCase();
    if (category) filters.category = String(category);
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.gte = new Date(String(startDate));
      if (endDate) filters.date.lte = new Date(String(endDate));
    }

    const records = await prisma.record.findMany({ 
      where: filters,
      orderBy: { date: 'desc' } 
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/records/:id', [authenticate, authorize(['ADMIN'])], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id); // Fixed type for Prisma
    
    // Convert to any to avoid exactOptionalPropertyTypes strictness on undefined updates
    const data: any = recordSchema.partial().parse(req.body); 
    
    // Clean undefined fields so Prisma doesn't complain
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    const updatedRecord = await prisma.record.update({
      where: { id },
      data,
    });
    res.json(updatedRecord);
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ error: 'Record not found' }); return; }
    res.status(400).json({ error: error.errors || error.message });
  }
});

app.delete('/api/records/:id', [authenticate, authorize(['ADMIN'])], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id); // Fixed type for Prisma
    await prisma.record.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ error: 'Record not found' }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 5. DASHBOARD SUMMARY APIS
// ==========================================
app.get('/api/dashboard/summary', [authenticate, authorize(['ADMIN', 'ANALYST', 'VIEWER'])], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const aggregations = await prisma.record.groupBy({
      by: ['type'],
      _sum: { amount: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    aggregations.forEach((agg) => {
      if (agg.type === 'INCOME') totalIncome = agg._sum.amount || 0;
      if (agg.type === 'EXPENSE') totalExpense = agg._sum.amount || 0;
    });

    const categoryTotals = await prisma.record.groupBy({
      by: ['category'],
      _sum: { amount: true },
    });

    res.json({
      summary: {
        totalIncome,
        totalExpenses: totalExpense,
        netBalance: totalIncome - totalExpense,
      },
      categoryBreakdown: categoryTotals.map(c => ({
        category: c.category,
        total: c._sum.amount
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 6. GLOBAL ERROR HANDLER
// ==========================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An unexpected backend error occurred.' });
});

// ==========================================
// 7. SERVER INIT
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Production-ready server running on http://localhost:${PORT}`);
});