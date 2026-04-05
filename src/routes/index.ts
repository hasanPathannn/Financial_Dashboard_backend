import { Router } from 'express';
import { register, login, updateUserStatus } from '../controllers/auth.controller';
import { createRecord, getRecords, updateRecord, deleteRecord } from '../controllers/record.controller';
import { getDashboardSummary } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Auth & Users
router.post('/auth/register', register);
router.post('/auth/login', login);
router.put('/users/:id/status', [authenticate, authorize(['ADMIN'])], updateUserStatus);

// Financial Records
router.post('/records', [authenticate, authorize(['ADMIN'])], createRecord);
router.get('/records', [authenticate, authorize(['ADMIN', 'ANALYST'])], getRecords);
router.put('/records/:id', [authenticate, authorize(['ADMIN'])], updateRecord);
router.delete('/records/:id', [authenticate, authorize(['ADMIN'])], deleteRecord);

// Dashboard
router.get('/dashboard/summary', [authenticate, authorize(['ADMIN', 'ANALYST', 'VIEWER'])], getDashboardSummary);

export default router;