import mongoose from 'mongoose';

const externalDocumentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    createdAtIso: {
      type: String,
      required: true,
    },
    updatedAtIso: {
      type: String,
    },

    // External source data
    companyName: {
      type: String,
      required: true,
    },
    reference: {
      // External shipment/doc number provided by the company (optional)
      type: String,
      default: '',
    },
    documentType: {
      // e.g. "Shipment", "Invoice", "BL", etc. (optional)
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },

    // Where Cloudinary saved the uploads (helps keep “folder” structure)
    folderPath: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'outside',
    },

    documents: [
      {
        documentUrl: { type: String, required: true },
        fileName: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        uploadedAtIso: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model('ExternalDocument', externalDocumentSchema);

