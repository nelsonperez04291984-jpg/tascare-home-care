import express from 'express';
import { getUsers, createUser, deleteUser, createWorker, deleteWorker } from '../controllers/adminController.js';

const router = express.Router();

// User management
router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);

// Worker management (GET is handled in schedulingRoutes)
router.post('/workers', createWorker);
router.delete('/workers/:id', deleteWorker);

export default router;
