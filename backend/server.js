import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import connectDB from "./src/config/mongodb.config.js";
import { connectCloudinary } from "./src/config/cloudinary.config.js";
import authRoutes from "./src/routes/auth.routes.js";
import { generalLimiter } from "./src/middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./src/middleware/errorHandler.js";

// App config
const app = express();
const port = process.env.PORT || 3000;

// Connect to database and external services
await connectDB();
await connectCloudinary();

// Security middleware - Helmet sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding resources from other origins
}));

// CORS middleware - Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Allow frontend origin
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));

// Logging middleware - Morgan logs HTTP requests
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Detailed logs in development
} else {
  app.use(morgan('combined')); // Standard Apache combined logs in production
}

// Body parser middleware - Parse incoming request bodies
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with 10MB limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Rate limiting middleware - Apply to all API routes
app.use('/api', generalLimiter);

// Health check endpoint - Check if server is running
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);

// 404 handler - Catch requests to undefined routes
app.use(notFoundHandler);

// Global error handler - Catch all errors
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check: http://localhost:${port}/health`);
});
