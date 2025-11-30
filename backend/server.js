import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import connectDB from "./src/config/mongodb.config.js";
import { connectCloudinary } from "./src/config/cloudinary.config.js";
import { initializeSocketIO, setSocketIOInstance } from "./src/config/socket.config.js";
import { initializeAllNamespaces } from "./src/socket/index.js";
import authRoutes from "./src/routes/auth.routes.js";
import discussionRoutes from "./src/routes/discussion.routes.js";
import commentRoutes from "./src/routes/comment.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import courseRoutes from "./src/routes/course.routes.js";
import chapterRoutes from "./src/routes/chapter.routes.js";
import sessionRoutes from "./src/routes/session.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import analyticsRoutes from "./src/routes/analytics.routes.js";
import lessonRoutes from "./src/routes/lesson.routes.js";
import { generalLimiter } from "./src/middleware/rateLimiter.js";
import { setupAnalyticsCronJobs } from "./src/services/cron.service.js";
import { errorHandler, notFoundHandler } from "./src/middleware/errorHandler.js";

// App config
const app = express();
const httpServer = createServer(app); // Create HTTP server for Socket.IO
const port = process.env.PORT || 3000;

// Connect to database and external services
await connectDB();
await connectCloudinary();

// Initialize Socket.IO server
const io = initializeSocketIO(httpServer);
setSocketIOInstance(io);

// Initialize all Socket.IO namespaces (/discussion, /session, /notification, /progress)
initializeAllNamespaces(io);

// Setup cron jobs for analytics
setupAnalyticsCronJobs();

// Security middleware - Helmet sets various HTTP headers for security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding resources from other origins
  })
);

// CORS middleware - Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Allow frontend origin
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

// Logging middleware - Morgan logs HTTP requests
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Detailed logs in development
} else {
  app.use(morgan("combined")); // Standard Apache combined logs in production
}

// Body parser middleware - Parse incoming request bodies
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies with 10MB limit
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies

// Rate limiting middleware - Apply to all API routes
app.use("/api", generalLimiter);

// Middleware to attach Socket.IO instance to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint - Check if server is running
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    socketIO: "enabled",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/chapter", chapterRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/lessons", lessonRoutes)

// 404 handler - Catch requests to undefined routes
app.use(notFoundHandler);

// Global error handler - Catch all errors
app.use(errorHandler);

// Start server (use httpServer instead of app for Socket.IO)
httpServer.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Health check: http://localhost:${port}/health`);
  console.log(`✅ Socket.IO enabled on ws://localhost:${port}`);
  console.log(`   - /discussion namespace: Real-time course discussions`);
  console.log(`   - /session namespace: WebRTC video sessions`);
  console.log(`   - /notification namespace: Real-time notifications`);
  console.log(`   - /progress namespace: Learning progress tracking`);
});
