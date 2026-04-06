import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import knex from 'knex';
import knexConfig from '../knexfile.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Database
const db = knex(knexConfig.development);

app.use(cors());
app.use(express.json());

// Basic Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Home Care Management API' });
});

// Import Routes
import referralRoutes from './routes/referralRoutes.js';
import careSchedulingRoutes from './routes/careSchedulingRoutes.js';

app.use('/api/referrals', referralRoutes);
app.use('/api/care-scheduling', careSchedulingRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { db };
