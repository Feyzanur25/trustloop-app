const mongoose = require("mongoose");

const ApprovalSchema = new mongoose.Schema(
  {
    loopId: { type: String, required: true, unique: true },
    clientApproved: { type: Boolean, default: false },
    freelancerApproved: { type: Boolean, default: false },
    requiredApprovals: { type: Number, default: 2, min: 1, max: 2 },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Approval = mongoose.model("Approval", ApprovalSchema);
module.exports = Approval;
