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

const pricingRulesSchema = new mongoose.Schema({
  pricePerKgUsd: {
    type: Number,
    required: true,
    default: 0,
  },
  warehouseHandlingFeeUsd: {
    type: Number,
    required: true,
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
  customRules: [customPricingRuleSchema],
}, {
  timestamps: true,
});

// Ensure only one pricing rules document exists
pricingRulesSchema.statics.getPricingRules = async function() {
  let rules = await this.findOne();
  if (!rules) {
    rules = await this.create({
      pricePerKgUsd: 0,
      warehouseHandlingFeeUsd: 0,
      transportPriceUsd: {
        Truck: 0,
        Air: 0,
        Bike: 0,
        Ship: 0,
      },
      logisticsMethods: ['Truck', 'Air', 'Bike', 'Ship'],
      cbmRateUsd: 0,
      cbmDivisorByMethod: { Truck: 333, Air: 167, Bike: 250, Ship: 1000 },
      customRules: [],
    });
  }
  return rules;
};

export default mongoose.model('PricingRules', pricingRulesSchema);
