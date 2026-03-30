const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["trust.created", "trust.confirmed", "trust.closed", "trust.approved"],
      required: true,
    },
    loopId: { type: String, required: true, index: true },
    detail: String,
    walletAddress: String,
    txHash: String,
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", EventSchema);
module.exports = Event;
