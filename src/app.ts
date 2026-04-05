import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(cors());
app.use(express.json());

// Root path to prevent "Cannot GET /" in the browser
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Finance Dashboard API is running modularly and perfectly!' });
});

// Mount all API routes under /api
app.use('/api', routes);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An unexpected backend error occurred.' });
});

export default app;