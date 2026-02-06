import express from 'express';
import {
  getClientDashboard,
  getClientProfile,
  updateClientProfile,
  getClientShipments,
  getClientShipmentById,
  createShipment,
  updateShipment,
  deleteShipment,
  submitShipment,
  getWarehouses,
  markDelivered
} from '../controllers/client.controller.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', getClientDashboard);

// Profile
router.get('/profile', getClientProfile);
router.put('/profile', updateClientProfile);

// Warehouses
router.get('/warehouses', getWarehouses);

// Shipments
router.get('/shipments', getClientShipments);
router.get('/shipments/:id', getClientShipmentById);
router.post('/shipments', createShipment);
router.put('/shipments/:id', updateShipment);
router.delete('/shipments/:id', deleteShipment);
router.post('/shipments/:id/submit', submitShipment);
router.post('/shipments/:id/mark-delivered', markDelivered);

export default router;
