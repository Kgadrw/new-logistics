import express from 'express';
import { getNotifications, markNotificationsRead } from '../controllers/notifications.controller.js';

const router = express.Router();

router.get('/', getNotifications);
router.post('/mark-read', markNotificationsRead);

export default router;
