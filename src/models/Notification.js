import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  createdAtIso: {
    type: String,
    required: true,
  },
  roleTargets: [{
    type: String,
    enum: ['client', 'warehouse', 'admin'],
  }],
  unreadBy: {
    client: {
      type: Boolean,
      default: true,
    },
    warehouse: {
      type: Boolean,
      default: true,
    },
    admin: {
      type: Boolean,
      default: true,
    },
  },
  shipmentId: String,
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  // Tracks whether we already sent an email for this notification
  // (prevents duplicate emails when background jobs run).
  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAtIso: {
    type: String,
    default: null,
  },
  // Lock to avoid duplicate sending when a background job and a real-time
  // notification sender pick up the same notification concurrently.
  emailSending: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Notification', notificationSchema);
