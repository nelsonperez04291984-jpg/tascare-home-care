import express from 'express';
import { createCarePlan, getClientCarePlan, updateCarePlan } from '../controllers/carePlanController.js';
import { createVisit, getWeeklySchedule, getSupportWorkers } from '../controllers/scheduleController.js';

const router = express.Router();

// Scheduling Routes — MUST be before /:client_id to avoid Express param capture
router.get('/workers', getSupportWorkers);
router.get('/visits', getWeeklySchedule);
router.post('/visits', createVisit);

// Care Plan Routes
router.post('/', createCarePlan);
router.get('/:client_id', getClientCarePlan);
router.patch('/:id', updateCarePlan);

export default router;
