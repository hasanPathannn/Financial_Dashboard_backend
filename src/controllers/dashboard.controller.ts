import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth';

export const getDashboardSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const aggregations = await prisma.record.groupBy({ by: ['type'], _sum: { amount: true } });
    let totalIncome = 0; let totalExpense = 0;
    
    aggregations.forEach((agg) => {
      if (agg.type === 'INCOME') totalIncome = agg._sum.amount || 0;
      if (agg.type === 'EXPENSE') totalExpense = agg._sum.amount || 0;
    });

    const categoryTotals = await prisma.record.groupBy({ by: ['category'], _sum: { amount: true } });

    res.json({
      summary: { totalIncome, totalExpenses: totalExpense, netBalance: totalIncome - totalExpense },
      categoryBreakdown: categoryTotals.map(c => ({ category: c.category, total: c._sum.amount }))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};