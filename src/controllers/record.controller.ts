import { Response } from 'express';
import { prisma } from '../config/db';
import { recordSchema } from '../utils/validation';
import { AuthRequest } from '../middlewares/auth';

export const createRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = recordSchema.parse(req.body);
    const record = await prisma.record.create({ data: { ...data, userId: req.user!.id } });
    res.status(201).json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

export const getRecords = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const records = await prisma.record.findMany({ where: filters, orderBy: { date: 'desc' } });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const data: any = recordSchema.partial().parse(req.body); 
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    const updatedRecord = await prisma.record.update({ where: { id }, data });
    res.json(updatedRecord);
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ error: 'Record not found' }); return; }
    res.status(400).json({ error: error.errors || error.message });
  }
};

export const deleteRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.record.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ error: 'Record not found' }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
};