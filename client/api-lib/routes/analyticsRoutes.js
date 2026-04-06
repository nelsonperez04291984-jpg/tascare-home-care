import express from 'express';
import { getExecutiveInsights } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/insights', getExecutiveInsights);

export default router;
