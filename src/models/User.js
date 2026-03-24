import mongoose from 'mongoose';

const customPricingRuleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['fixed', 'percent', 'perKg', 'perCbm'], required: true },
  value: { type: Number, required: true, default: 0 },
  methods: [{
    type: String,
    enum: ['Truck', 'Air', 'Bike', 'Ship'],
  }],
  enabled: { type: Boolean, default: true },
}, { _id: false });

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
    Truck: {
      type: Number,
      default: 0,
    },
    Air: {
      type: Number,
      default: 0,
    },
    Bike: {
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
    enum: ['Truck', 'Air', 'Bike', 'Ship'],
  }],
  cbmRateUsd: {
    type: Number,
    default: 0,
  },
  cbmDivisorByMethod: {
    Truck: { type: Number, default: 333 },
    Air: { type: Number, default: 167 },
    Bike: { type: Number, default: 250 },
    Ship: { type: Number, default: 1000 },
  },
  customPricingRules: [customPricingRuleSchema],
}, {
  timestamps: true,
});

export default mongoose.model('User', userSchema);
