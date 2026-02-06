import mongoose from 'mongoose';

const pricingRulesSchema = new mongoose.Schema({
  pricePerKgUsd: {
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
  warehouseHandlingFeeUsd: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

// Ensure only one pricing rules document exists
pricingRulesSchema.statics.getPricingRules = async function() {
  let rules = await this.findOne();
  if (!rules) {
    rules = await this.create({
      pricePerKgUsd: 0,
      transportPriceUsd: {
        Truck: 0,
        Air: 0,
        Bike: 0,
        Ship: 0,
      },
      warehouseHandlingFeeUsd: 0,
    });
  }
  return rules;
};

export default mongoose.model('PricingRules', pricingRulesSchema);
