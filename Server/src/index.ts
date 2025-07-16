// Load environment variables first
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Debug environment variables
console.log("Environment loaded: NODE_ENV =", process.env.NODE_ENV);
console.log("API running at port:", process.env.PORT || 8001);

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import studentRoutes from "./routes/student.routes";
import userRoutes from "./routes/users.routes";
import mineralsRoutes from "./routes/minerals.routes";
import rocksRoutes from "./routes/rocks.routes";
import rockImagesRoutes from "./routes/rock-images.routes";
import { setupStorageBuckets } from "./config/setup-storage";

// Create Express app
const app = express();
const PORT = process.env.PORT || 8001;

// FUCK CORS - ALLOW EVERYTHING
app.use(cors());
app.use(
  cors({
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
    credentials: false,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Credentials", "false");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware
app.use(express.json());

// for logging
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/minerals", mineralsRoutes);
app.use("/api/rocks", rocksRoutes);
app.use("/api/rock-images", rockImagesRoutes);

// Health check routes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Add API prefix health check endpoint to match client expectations
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// 404 handler for unmatched routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      "/api/auth/*",
      "/api/admin/*",
      "/api/student/*",
      "/api/users/*",
      "/api/minerals/*",
      "/api/rocks/*",
      "/api/rock-images/*",
      "/health",
      "/api/health",
    ],
  });
});

// Initialize Supabase storage buckets
setupStorageBuckets().catch((err) => {
  console.error("Error setting up storage buckets:", err);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
