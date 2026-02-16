import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  weightKg: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  imageUrl: String,
  packagingType: String,
  cbm: Number,
  lengthCm: Number,
  widthCm: Number,
  heightCm: Number,
  isFragile: Boolean,
  isHazardous: Boolean,
  specialInstructions: String,
}, { _id: false });

const dispatchSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['Truck', 'Air', 'Bike', 'Ship'],
  },
  transportId: String,
  departureDateIso: String,
  packagingList: String,
  packageNumber: String,
  consigneeNumber: String,
  shippingMark: {
    type: String,
    default: 'UZA Solutions',
  },
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  clientId: {
    type: String,
    required: true,
  },
  warehouseName: {
    type: String,
    required: true,
  },
  warehouseId: String,
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Received', 'Left Warehouse', 'In Transit', 'Delivered'],
    default: 'Draft',
  },
  products: [productSchema],
  notes: String,
  warehouseRemarks: String,
  receivedProductImages: [String], // Array of image URLs for received products
  draftBL: String, // Draft Bill of Lading
  consumerNumber: String, // Consumer number for warehouse
  createdAtIso: {
    type: String,
    required: true,
  },
  updatedAtIso: {
    type: String,
    required: true,
  },
  estimatedCostUsd: {
    type: Number,
    required: true,
  },
  dispatch: dispatchSchema,
}, {
  timestamps: true,
});

export default mongoose.model('Shipment', shipmentSchema);
