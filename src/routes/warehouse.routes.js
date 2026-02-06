import express from 'express';
import {
  getWarehouseDashboard,
  getWarehouseProfile,
  updateWarehouseProfile,
  getIncomingShipments,
  getOutgoingShipments,
  getShipmentHistory,
  getShipmentById,
  receiveShipment,
  dispatchShipment,
  updateShipmentStatus,
  addWarehouseRemarks,
  markInTransit
} from '../controllers/warehouse.controller.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', getWarehouseDashboard);

// Profile
router.get('/profile', getWarehouseProfile);
router.put('/profile', updateWarehouseProfile);

// Shipments
router.get('/incoming', getIncomingShipments);
router.get('/outgoing', getOutgoingShipments);
router.get('/history', getShipmentHistory);
router.get('/shipments/:id', getShipmentById);
router.post('/shipments/:id/receive', receiveShipment);
router.post('/shipments/:id/dispatch', dispatchShipment);
router.post('/shipments/:id/in-transit', markInTransit);
router.put('/shipments/:id/status', updateShipmentStatus);
router.put('/shipments/:id/remarks', addWarehouseRemarks);

export default router;
