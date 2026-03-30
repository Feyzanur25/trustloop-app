const mongoose = require("mongoose");

const LoopSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    counterparty: { type: String, required: true },
    role: { type: String, enum: ["Client", "Freelancer"], default: "Client" },
    status: { type: String, enum: ["Pending", "Active", "Completed"], default: "Pending" },
    score: { type: Number, default: 0, min: 0, max: 100 },
    expiresInDays: { type: Number, default: 14, min: 1, max: 90 },
    lastEvent: { type: String, default: "trust.created" },
    createdAt: { type: Date, default: Date.now },
    txHash: { type: String },
    approvalPolicy: { type: String, enum: ["single", "dual"], default: "dual" },
    walletAddress: String,
  },
  { timestamps: true }
);

const Loop = mongoose.model("Loop", LoopSchema);
module.exports = Loop;
