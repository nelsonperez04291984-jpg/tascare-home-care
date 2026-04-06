import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import knex from 'knex';
import knexConfig from '../knexfile.js';

dotenv.config();

const app = express();

// Initialize Database
const env = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[env]);

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TasCare API', env });
});

// Import Routes
import referralRoutes from './routes/referralRoutes.js';
import careSchedulingRoutes from './routes/careSchedulingRoutes.js';

app.use('/api/referrals', referralRoutes);
app.use('/api/care-scheduling', careSchedulingRoutes);

// CRITICAL: Export for Vercel Serverless (do NOT call app.listen)
export { db };
export default app;
