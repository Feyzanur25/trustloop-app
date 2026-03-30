const mongoose = require("mongoose");

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/trustloop";
    
    await mongoose.connect(mongoUri);
    
    console.log("✓ MongoDB connected successfully");
    return true;
  } catch (error) {
    console.error("✗ MongoDB connection error:", error.message);
    console.log("⚠ Using in-memory fallback mode (data will not persist on restart)");
    return false;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log("✓ MongoDB disconnected");
  } catch (error) {
    console.error("✗ Disconnect error:", error.message);
  }
}

module.exports = { connectDB, disconnectDB };
