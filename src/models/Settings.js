import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: 'system-settings',
  },
  // Notification Settings
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  // Total number of shipment notification emails successfully sent via Nodemailer.
  // Used for the admin dashboard stats card.
  totalEmailsSent: {
    type: Number,
    default: 0,
  },
  notifyOnShipmentReceived: {
    type: Boolean,
    default: true,
  },
  notifyOnShipmentDispatched: {
    type: Boolean,
    default: true,
  },
  notifyOnStatusChange: {
    type: Boolean,
    default: true,
  },
  // System Settings
  defaultCurrency: {
    type: String,
    default: 'USD',
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  dateFormat: {
    type: String,
    default: 'YYYY-MM-DD',
  },
  // Document Settings
  maxImageSizeMB: {
    type: Number,
    default: 5,
  },
  maxDocumentSizeMB: {
    type: Number,
    default: 10,
  },
  allowedImageTypes: {
    type: String,
    default: 'JPG, PNG, GIF, WEBP',
  },
  allowedDocumentTypes: {
    type: String,
    default: 'PDF, JPG, PNG, GIF, WEBP',
  },
  // Auto-Notification Settings
  autoNotifyClientOnReceive: {
    type: Boolean,
    default: true,
  },
  autoNotifyClientOnDispatch: {
    type: Boolean,
    default: true,
  },
  autoNotifyAdminOnShipment: {
    type: Boolean,
    default: true,
  },
  updatedAtIso: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Static method to get or create settings
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ id: 'system-settings' });
  if (!settings) {
    const nowIso = new Date().toISOString();
    settings = new this({
      id: 'system-settings',
      updatedAtIso: nowIso,
    });
    await settings.save();
  }
  return settings;
};

export default mongoose.model('Settings', settingsSchema);
