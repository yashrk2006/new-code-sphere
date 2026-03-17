import mongoose from 'mongoose';

// Ensure the connection is established somewhere in your main backend startup (e.g. index.ts)
// mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/visionaiot')

// For the "Active Edge Nodes" 0/3 metric
const nodeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ipAddress: { type: String, required: true },
  status: { type: String, enum: ['UP', 'DOWN', 'MAINTENANCE'], default: 'UP' },
  modelConfig: { type: String, default: 'YOLOv8m-parking' },
  lastHeartbeat: { type: Date, default: Date.now }
});

export const NodeModel = mongoose.model('Node', nodeSchema);

// For the "Priority Alerts" sidebar
const anomalySchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., "UNAUTHORIZED VEHICLE"
  location: { type: String, required: true }, // e.g., "CAM-01"
  confidence: { type: Number, required: true }, // e.g., 0.87
  timestamp: { type: Date, default: Date.now },
  imageUrl: String, // Path to the frame capture for admin review
  resolved: { type: Boolean, default: false }
});

export const AnomalyModel = mongoose.model('Anomaly', anomalySchema);
