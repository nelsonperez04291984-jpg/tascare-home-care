import express from 'express';
import { createCarePlan, getClientCarePlan, updateCarePlan } from '../controllers/carePlanController.js';
import { createVisit, getWeeklySchedule, getSupportWorkers } from '../controllers/scheduleController.js';

const router = express.Router();

// Care Plan Routes
router.post('/', createCarePlan);
router.get('/:client_id', getClientCarePlan);
router.patch('/:id', updateCarePlan);

// Scheduling Routes
router.post('/visits', createVisit);
router.get('/visits', getWeeklySchedule);
router.get('/workers', getSupportWorkers);

export default router;
