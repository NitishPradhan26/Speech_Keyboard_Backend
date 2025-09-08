import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import logger from './config/logger';
import userRoutes from './routes/userRoutes';
import transcriptRoutes from './routes/transcriptRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || '3000';

// Trust proxy headers for Render deployment
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRoutes);
app.use('/api/transcripts', transcriptRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Speech Keyboard Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});