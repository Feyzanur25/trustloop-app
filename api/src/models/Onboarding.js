const mongoose = require("mongoose");

const OnboardingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    walletAddress: { type: String, required: true, unique: true },
    feedback: String,
    productRating: { type: Number, min: 1, max: 5, default: 4 },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const Onboarding = mongoose.model("Onboarding", OnboardingSchema);
module.exports = Onboarding;
