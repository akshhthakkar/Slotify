const mongoose = require("mongoose");
require("dotenv").config();

const resetDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected.");

    console.log("Dropping Database...");
    await mongoose.connection.db.dropDatabase();
    console.log("Database dropped successfully.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
};

resetDatabase();
