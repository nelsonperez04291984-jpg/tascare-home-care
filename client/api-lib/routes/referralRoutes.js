import express from 'express';
import multer from 'multer';
import { createReferral, getReferrals, getReferralById, updateReferralStatus, processAIIntake } from '../controllers/referralController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public - Hospital/GP submission
router.post('/public', createReferral);

// Dashboard - Admin view
router.get('/', getReferrals);
router.post('/', createReferral); // Internal creation
router.get('/:id', getReferralById);
router.patch('/:id/status', updateReferralStatus);

// AI Intake Parsing
router.post('/parse-ai', upload.single('referralFile'), processAIIntake);

export default router;
