const mongoose = require("mongoose");

// Suppress strictQuery deprecation warning
mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`
    ╔════════════════════════════════════════════╗
    ║  ✅ MongoDB Connected Successfully         ║
    ║  Host: ${conn.connection.host.padEnd(26)}          ║
    ║  DB:   ${conn.connection.name.padEnd(26)}          ║
    ╚════════════════════════════════════════════╝
    `);

    // Handle MongoDB connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected successfully");
    });
  } catch (error) {
    console.error(`
    ╔══════════════════════════════════════╗
    ║  ❌ MongoDB Connection Failed        ║
    ║  Error: ${error.message.padEnd(28)} ║
    ╚══════════════════════════════════════╝
    `);
    process.exit(1);
  }
};

module.exports = connectDB;
