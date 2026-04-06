import express from 'express';
import { getBillingSummary, getDexExport } from '../controllers/billingController.js';

const router = express.Router();

router.get('/summary', getBillingSummary);
router.get('/export-dex', getDexExport);

export default router;
