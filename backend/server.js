require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const cron = require("node-cron");

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Passport configuration
require("./config/passport")(passport);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Passport middleware
app.use(passport.initialize());

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/business", require("./routes/businessRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/staff", require("./routes/staffRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start reminder scheduler
const reminderScheduler = require("./utils/reminderScheduler");
reminderScheduler.start();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║                                        ║
  ║   🚀 Slotify Server Running            ║
  ║                                        ║
  ║   Port: ${PORT}                           ║
  ║   Env:  ${process.env.NODE_ENV || "development"}                    ║
  ║   Time: ${new Date().toLocaleString()}         ║
  ║                                        ║
  ╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  process.exit(0);
});

module.exports = app;
