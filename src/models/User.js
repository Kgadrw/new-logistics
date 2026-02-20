import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['client', 'warehouse', 'admin'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  // Client-specific fields
  phone: String,
  address: String,
  company: String,
  // Warehouse-specific fields
  location: String,
  capacity: String,
  manager: String,
  contact: String,
  // Consignee details
  consigneeName: String,
  consigneeTin: String,
  consigneeAddress: String,
  consigneePhone: String,
  consigneeEmail: String,
  // Warehouse pricing
  pricePerKgUsd: {
    type: Number,
    default: 0,
  },
  warehouseHandlingFeeUsd: {
    type: Number,
    default: 0,
  },
  transportPriceUsd: {
    Air: {
      type: Number,
      default: 0,
    },
    Ship: {
      type: Number,
      default: 0,
    },
  },
  logisticsMethods: [{
    type: String,
    enum: ['Air', 'Ship'],
  }],
}, {
  timestamps: true,
});

export default mongoose.model('User', userSchema);
