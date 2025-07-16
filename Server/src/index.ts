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

// Configure CORS for production and development
const allowedOrigins = [
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000", // React dev server
  "http://localhost:8080", // Alternative dev server
  "https://petro-core-usep-frontend.onrender.com", // Your frontend Render URL
  "https://petro-core-usep.vercel.app", // If you deploy on Vercel
  "https://petro-core-usep.netlify.app", // If you deploy on Netlify
  // Add your actual frontend production URLs here
];

// Add environment-based origins
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

console.log("🌐 CORS allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn("🚫 CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
      "Pragma",
    ],
    credentials: true, // Enable credentials for authentication
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  })
);

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma"
  );
  res.header("Access-Control-Allow-Credentials", "true");

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
