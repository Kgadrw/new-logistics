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
}, {
  timestamps: true,
});

export default mongoose.model('Notification', notificationSchema);
