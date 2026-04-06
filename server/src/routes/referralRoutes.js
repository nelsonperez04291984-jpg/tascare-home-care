import express from 'express';
import multer from 'multer';
import { createReferral, getReferrals, updateReferralStatus, processAIIntake } from '../controllers/referralController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public - Hospital/GP submission
router.post('/public', createReferral);

// Dashboard - Admin view (Auth should be added here)
router.get('/', getReferrals);
router.patch('/:id/status', updateReferralStatus);

// AI Intake Parsing
router.post('/parse-ai', upload.single('referralFile'), processAIIntake);

export default router;
