import express from 'express';
import {
  getAdminDashboard,
  getAdminProfile,
  updateAdminProfile,
  getAllShipments,
  getShipmentById,
  updateShipment,
  deleteShipment,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPricingRules,
  updatePricingRules,
  getAuditLogs,
  getStatistics
} from '../controllers/admin.controller.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', getAdminDashboard);
router.get('/statistics', getStatistics);

// Profile
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

// Shipments
router.get('/shipments', getAllShipments);
router.get('/shipments/:id', getShipmentById);
router.put('/shipments/:id', updateShipment);
router.delete('/shipments/:id', deleteShipment);

// Users
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Pricing
router.get('/pricing', getPricingRules);
router.put('/pricing', updatePricingRules);

// Audit
router.get('/audit', getAuditLogs);

export default router;
