import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import connectDB from "./src/config/mongodb.config.js";
import { connectCloudinary } from "./src/config/cloudinary.config.js";
import {
  initializeSocketIO,
  setSocketIOInstance,
} from "./src/config/socket.config.js";
import { initializeAllNamespaces } from "./src/socket/index.js";
import authRoutes from "./src/routes/auth.routes.js";
import discussionRoutes from "./src/routes/discussion.routes.js";
import commentRoutes from "./src/routes/comment.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import teacherRoutes from "./src/routes/teacher.routes.js";
import courseRoutes from "./src/routes/course.routes.js";
import chapterRoutes from "./src/routes/chapter.routes.js";
import sessionRoutes from "./src/routes/session.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import analyticsRoutes from "./src/routes/analytics.routes.js";
import lessonRoutes from "./src/routes/lesson.routes.js";
import progressRoutes from "./src/routes/progress.routes.js";
import quizRoutes from "./src/routes/quiz.routes.js";
import questionRoutes from "./src/routes/question.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import reportRoutes from "./src/routes/report.routes.js";
import { generalLimiter } from "./src/middleware/rateLimiter.js";
import { setupAnalyticsCronJobs } from "./src/services/cron.service.js";
import {
  errorHandler,
  notFoundHandler,
} from "./src/middleware/errorHandler.js";

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
        styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
        scriptSrc: [
          "'self'",
          "https://accounts.google.com",
          "https://apis.google.com",
          "https://accounts.youtube.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://lh3.googleusercontent.com",
          "https://ssl.gstatic.com",
          "https://www.gstatic.com",
        ],
        connectSrc: ["'self'", "https://accounts.google.com"],
        frameSrc: ["'self'", "https://accounts.google.com"],
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
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/questions", questionRoutes);
import uploadRoutes from "./src/routes/upload.routes.js";

// ... existing code ...

app.use("/api/questions", questionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes); // Register upload route
// 404 handler - Catch requests to undefined routes
app.use(notFoundHandler);

// Global error handler - Catch all errors
app.use(errorHandler);

// Global process error handlers to prevent silent crashes
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1); // Exit with failure code to trigger nodemon restart
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start server with port retry logic (handles EADDRINUSE errors)
async function startServer(startPort, maxAttempts = 10) {
  let currentPort = startPort;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      await new Promise((resolve, reject) => {
        const server = httpServer.listen(currentPort, () => {
          console.log(`✅ Server running on port ${currentPort}`);
          console.log(
            `✅ Environment: ${process.env.NODE_ENV || "development"}`
          );
          console.log(
            `✅ Health check: http://localhost:${currentPort}/health`
          );
          console.log(`✅ Socket.IO enabled on ws://localhost:${currentPort}`);
          console.log(
            `   - /discussion namespace: Real-time course discussions`
          );
          console.log(`   - /session namespace: WebRTC video sessions`);
          console.log(`   - /notification namespace: Real-time notifications`);
          console.log(`   - /progress namespace: Learning progress tracking`);
          console.log(
            `✅ Rate limiting disabled: ${
              process.env.DISABLE_RATE_LIMIT === "true"
            }`
          );
          resolve();
        });

        server.on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            reject(err);
          } else {
            console.error("❌ Server error:", err);
            process.exit(1);
          }
        });
      });
      break; // Success, exit retry loop
    } catch (err) {
      if (err.code === "EADDRINUSE" && attempts < maxAttempts - 1) {
        console.log(
          `⚠️  Port ${currentPort} is busy, trying ${currentPort + 1}...`
        );
        currentPort++;
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay before retry
      } else {
        console.error(
          `❌ Failed to start server after ${attempts + 1} attempts`
        );
        throw err;
      }
    }
  }
}

// Start the server
startServer(Number(port)).catch((err) => {
  console.error("❌ Fatal error starting server:", err);
  process.exit(1);
});
