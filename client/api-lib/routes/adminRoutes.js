import express from 'express';
import { 
  getUsers, createUser, deleteUser, 
  createWorker, deleteWorker, 
  getTenant, updateTenant,
  getQualificationTypes, repairDatabase 
} from '../controllers/adminController.js';

const router = express.Router();

// Tenant & Organization
router.get('/tenant', getTenant);
router.patch('/tenant', updateTenant);
router.get('/repair', repairDatabase);

// User management
router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);

// Staff / Worker management
router.post('/workers', createWorker);
router.delete('/workers/:id', deleteWorker);
router.get('/qualifications', getQualificationTypes);

export default router;
