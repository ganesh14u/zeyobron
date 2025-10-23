import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import adminRoutes from "./routes/admin.js";
import categoryRoutes from "./routes/categories.js";

dotenv.config();
const app = express();

// ✅ Allowed origins (Netlify frontend, localhost, and backend)
const allowedOrigins = [
  "https://zeyobron.netlify.app",              // your Netlify frontend
  "https://zeyobron-frontend.onrender.com",   // your Render frontend (if used)
  "http://localhost:5173",                     // local development
  "https://hansitha-web-storefront.onrender.com", // backend itself
  process.env.CLIENT_URL                       // dynamic frontend URL from env
].filter(Boolean); // Remove undefined values

// ✅ CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked for origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Parse incoming JSON
app.use(express.json());

// ✅ Connect MongoDB
connectDB();

// ✅ Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Zeyobron Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ✅ Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);

// ✅ Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
