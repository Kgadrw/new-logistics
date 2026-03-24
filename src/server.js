import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/database.js';
import clientRoutes from './routes/client.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import Notification from './models/Notification.js';
import Shipment from './models/Shipment.js';
import { sendShipmentNotificationEmail } from './utils/email.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the backend root directory
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB (non-blocking)
connectDB().catch((err) => {
  console.error('Failed to connect to MongoDB on startup:', err.message);
  // Server will continue running even if DB connection fails
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'UZA Logistics API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Background job: automatically send emails for any pending (unsent) notifications.
// Useful for older dashboard notifications or cases where email sending was temporarily unavailable.
let emailJobInFlight = false;
setInterval(() => {
  void (async () => {
    if (emailJobInFlight) return
    emailJobInFlight = true
    try {
      // Reset any leftover emailSending locks for notifications that were not emailed yet.
      // This prevents stuck notifications blocking future automatic sends.
      await Notification.updateMany(
        { emailSent: { $ne: true }, emailSending: true },
        { $set: { emailSending: false } },
      )

      const pending = await Notification.find({ emailSent: { $ne: true }, emailSending: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(10)

      if (pending.length === 0) return

      for (const n of pending) {
        const shipment = await Shipment.findOne({ id: n.shipmentId })
        if (!shipment) continue
        await sendShipmentNotificationEmail({ notification: n, shipment })
      }
    } catch (err) {
      console.error('Pending email job failed:', err)
    } finally {
      emailJobInFlight = false
    }
  })()
}, 60 * 1000)

export default app;
