import mongoose from 'mongoose';

const auditEventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  createdAtIso: {
    type: String,
    required: true,
  },
  actor: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  detail: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('AuditEvent', auditEventSchema);
