# 4. Công nghệ và triển khai

## 4.1 Công nghệ Backend

### 4.1.1 Node.js và Express.js

#### A. Node.js Platform

**Lý do lựa chọn Node.js:**

1. **JavaScript Full-stack**: Sử dụng cùng ngôn ngữ cho cả frontend và backend, giảm context switching
2. **Non-blocking I/O**: Xử lý concurrent requests hiệu quả với event-driven architecture
3. **NPM Ecosystem**: Hệ sinh thái package phong phú với hơn 1.5 triệu packages
4. **Performance**: V8 JavaScript engine từ Google Chrome cho performance cao
5. **Scalability**: Dễ dàng scale horizontally với cluster mode

**Version sử dụng**: Node.js v18.x (LTS)

**[ẢNH: Diagram minh họa Node.js Event Loop và Non-blocking I/O model]**

#### B. Express.js Framework

**Express v5.1.0** - Minimalist web framework for Node.js

**Core Features được sử dụng:**

```javascript
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();
const httpServer = createServer(app);

// Middleware Stack
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "https://accounts.google.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", "https://accounts.google.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate Limiting
import { generalLimiter } from "./middleware/rateLimiter.js";
app.use("/api", generalLimiter);

// Routes
import authRoutes from "./routes/auth.routes.js";
import courseRoutes from "./routes/course.routes.js";
// ... other routes

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
// ... other route mounts

// Error Handling
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
app.use(notFoundHandler);
app.use(errorHandler);

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

**Middleware Architecture:**

1. **Security Middleware**: Helmet.js cho HTTP headers security
2. **CORS Middleware**: Enable cross-origin requests từ frontend
3. **Logging Middleware**: Morgan cho request logging
4. **Body Parser**: Parse JSON và URL-encoded data
5. **Rate Limiting**: Prevent abuse và DDoS attacks
6. **Authentication**: JWT verification
7. **Authorization**: Role-based access control
8. **Validation**: Input validation với Joi/Express-validator
9. **Error Handling**: Centralized error handling

**[ẢNH: Flowchart của Express middleware stack từ request đến response]**

### 4.1.2 MongoDB và Mongoose

#### A. MongoDB Database

**Lý do chọn MongoDB:**

1. **Schema Flexibility**: NoSQL cho phép thay đổi schema dễ dàng
2. **Document Model**: JSON-like documents phù hợp với JavaScript
3. **Scalability**: Horizontal scaling với sharding
4. **Performance**: Indexing và query optimization tốt
5. **Atlas Cloud**: Managed database service

**MongoDB Atlas Configuration:**

```javascript
// mongodb.config.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const options = {
      // Connection pool
      maxPoolSize: 10,
      minPoolSize: 5,

      // Timeouts
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,

      // Retry
      retryWrites: true,
      retryReads: true,

      // Other options
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    // Connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });

    return conn;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
```

**Database Optimization:**

```javascript
// Index examples
courseSchema.index({ teacherId: 1 });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ enrolledStudents: 1 });
courseSchema.index({ isPublished: 1, approvalStatus: 1 });

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Text search index
courseSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});
```

**[ẢNH: Screenshot của MongoDB Atlas dashboard với database metrics]**

#### B. Mongoose ODM

**Mongoose v8.19.1** - MongoDB object modeling for Node.js

**Schema Definition Pattern:**

```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
        message: "Invalid email format",
      },
    },
    password: {
      type: String,
      required: function () {
        return this.googleId == null; // Only required if not Google OAuth
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ["student", "teacher", "admin"],
        message: "{VALUE} is not a valid role",
      },
      default: "student",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save middleware - Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const bcrypt = await import("bcryptjs");
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance methods
userSchema.methods.matchPassword = async function (enteredPassword) {
  const bcrypt = await import("bcryptjs");
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual populate
userSchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "teacherId",
});

const User = mongoose.model("User", userSchema);
export default User;
```

**Query Optimization Examples:**

```javascript
// Efficient queries with select, populate, lean
const courses = await Course.find({ isPublished: true })
  .select("title description thumbnail teacherId price")
  .populate("teacherId", "fullName avatar")
  .lean() // Return plain JavaScript objects (faster)
  .limit(10)
  .sort("-createdAt");

// Aggregation pipeline
const courseStats = await Course.aggregate([
  { $match: { teacherId: teacherId } },
  {
    $group: {
      _id: null,
      totalCourses: { $sum: 1 },
      totalStudents: { $sum: { $size: "$enrolledStudents" } },
      avgRating: { $avg: "$rating" },
    },
  },
]);
```

**[ẢNH: Diagram minh họa Mongoose schema relationships với refs và virtuals]**

### 4.1.3 Socket.IO cho real-time communication

#### A. Socket.IO Server Configuration

**Socket.IO v4.8.1** - Bidirectional event-based communication

```javascript
// socket.config.js
import { Server } from "socket.io";
import { verifyAccessToken } from "./jwt.config.js";

let io = null;

export const initializeSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Connection settings
    pingTimeout: 60000,
    pingInterval: 25000,
    // Adapter settings for scaling
    transports: ["websocket", "polling"],
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Connection handling
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.userId}, Reason: ${reason}`);
    });
  });

  return io;
};

export const getSocketIOInstance = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

export const setSocketIOInstance = (socketIO) => {
  io = socketIO;
};
```

#### B. Namespace Architecture

**Separation of Concerns với Namespaces:**

```javascript
// socket/index.js
export const initializeAllNamespaces = (io) => {
  // Discussion namespace
  const discussionNamespace = io.of("/discussion");
  initializeDiscussionSocket(discussionNamespace);

  // Notification namespace
  const notificationNamespace = io.of("/notification");
  initializeNotificationSocket(notificationNamespace);

  // Chat namespace
  const chatNamespace = io.of("/chat");
  initializeChatSocket(chatNamespace);

  // Session namespace (for live sessions)
  const sessionNamespace = io.of("/session");
  initializeSessionSocket(sessionNamespace);

  console.log("All Socket.IO namespaces initialized");
};
```

**[ẢNH: Architecture diagram showing Socket.IO namespaces và rooms structure]**

#### C. Error Handling và Reconnection

```javascript
// Client-side reconnection logic
import { io } from "socket.io-client";

const socket = io(`${API_URL}/chat`, {
  auth: { token: localStorage.getItem("accessToken") },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
  // Refresh token if authentication failed
  if (error.message.includes("Authentication")) {
    refreshAuthToken();
  }
});

socket.on("reconnect", (attemptNumber) => {
  console.log("Reconnected after", attemptNumber, "attempts");
});

socket.on("reconnect_failed", () => {
  console.error("Failed to reconnect");
  // Notify user
});
```

**[ẢNH: Flowchart của Socket.IO reconnection strategy]**

### 4.1.4 WebRTC và Simple-peer

#### A. WebRTC Technology

**WebRTC (Web Real-Time Communication)** - Open-source project enabling real-time audio, video, and data communication between browsers.

**Core APIs:**

1. **MediaStream (getUserMedia)**

   - Access camera và microphone
   - Control media tracks (enable/disable)
   - Apply constraints (resolution, framerate)

2. **RTCPeerConnection**

   - Establish P2P connection
   - Handle ICE candidates
   - Manage connection state

3. **RTCDataChannel**
   - Send arbitrary data between peers
   - Low-latency messaging

**Connection Establishment:**

```javascript
// 1. Get local media
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});

// 2. Create peer connection
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
});

// 3. Add tracks to connection
stream.getTracks().forEach((track) => {
  pc.addTrack(track, stream);
});

// 4. Handle ICE candidates
pc.onicecandidate = (event) => {
  if (event.candidate) {
    sendToSignalingServer({
      type: "ice-candidate",
      candidate: event.candidate,
    });
  }
};

// 5. Handle remote stream
pc.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};

// 6. Create and send offer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
sendToSignalingServer({ type: "offer", sdp: offer });

// 7. Receive answer
const answer = await receiveFromSignalingServer();
await pc.setRemoteDescription(new RTCSessionDescription(answer));
```

**[ẢNH: Diagram showing WebRTC connection lifecycle với states]**

#### B. Simple-peer Library

**simple-peer v9.11.1** - WebRTC wrapper simplifying peer connection.

**Why Simple-peer:**

- Abstracts away WebRTC complexity
- Handles signaling internally
- Works with any signaling mechanism (Socket.IO, WebSocket)
- Cross-browser compatible
- Small bundle size (~8KB gzipped)

**Basic Usage:**

```javascript
import Peer from "simple-peer";

// Initiator (caller)
const peer1 = new Peer({
  initiator: true,
  stream: localStream,
  config: {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  },
});

peer1.on("signal", (data) => {
  // Send signal data to other peer via signaling server
  socket.emit("signal", { to: otherPeerId, signal: data });
});

peer1.on("stream", (remoteStream) => {
  // Received remote stream
  remoteVideo.srcObject = remoteStream;
});

peer1.on("error", (err) => {
  console.error("Peer error:", err);
});

peer1.on("close", () => {
  console.log("Connection closed");
});

// Receiver (answerer)
const peer2 = new Peer({
  initiator: false,
  stream: localStream,
});

peer2.on("signal", (data) => {
  socket.emit("signal", { to: otherPeerId, signal: data });
});

// When receiving signal from other peer
socket.on("signal", ({ from, signal }) => {
  peer.signal(signal);
});
```

**[ẢNH: Code comparison - Raw WebRTC API vs Simple-peer]**

#### C. Signaling Server với Socket.IO

**Integration Pattern:**

```javascript
// Server-side signaling
io.of("/session").on("connection", (socket) => {
  // Store socket-to-user mapping
  const userId = socket.userId;
  socketUserMap.set(socket.id, userId);

  // Relay WebRTC signals
  socket.on("signal", ({ to, signal }) => {
    io.of("/session").to(to).emit("signal", {
      from: socket.id,
      signal,
    });
  });

  socket.on("disconnect", () => {
    socketUserMap.delete(socket.id);
  });
});
```

**Signaling Flow:**

1. User A creates offer → sends via Socket.IO
2. Signaling server relays offer to User B
3. User B creates answer → sends via Socket.IO
4. Signaling server relays answer to User A
5. ICE candidates exchanged similarly
6. P2P connection established
7. Media streams directly between peers (bypassing server)

**[ẢNH: Sequence diagram showing signaling flow]**

#### D. STUN/TURN Servers

**STUN Server Configuration:**

```javascript
const iceServers = [
  // Google's public STUN servers
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];
```

**STUN vs TURN:**

| Feature      | STUN          | TURN            |
| ------------ | ------------- | --------------- |
| Purpose      | NAT traversal | Relay media     |
| Data path    | Direct P2P    | Through server  |
| Bandwidth    | Client only   | Server + Client |
| Cost         | Free          | Expensive       |
| Success rate | ~80%          | ~100%           |

**When TURN is needed:**

- Symmetric NAT
- Corporate firewalls
- Strict security policies

**TURN Server Setup (Optional):**

```javascript
// Using coturn server
const iceServers = [
  { urls: "stun:stun.example.com:3478" },
  {
    urls: "turn:turn.example.com:3478",
    username: "user",
    credential: "pass",
  },
];
```

**[ẢNH: Diagram showing P2P connection với và không có TURN relay]**

#### E. Media Constraints và Optimization

**Adaptive Constraints:**

```javascript
// High quality (teacher/presenter)
const hdConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
  },
};

// Lower quality (students in grid)
const sdConstraints = {
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 15 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
  },
};

// Apply based on role and network
const constraints = isTeacher ? hdConstraints : sdConstraints;
const stream = await navigator.mediaDevices.getUserMedia(constraints);
```

**Bandwidth Estimation:**

```javascript
peer.on("connect", () => {
  setInterval(async () => {
    const stats = await peer._pc.getStats();
    stats.forEach((report) => {
      if (report.type === "inbound-rtp" && report.mediaType === "video") {
        const bytesReceived = report.bytesReceived;
        const bandwidth = ((bytesReceived - lastBytesReceived) * 8) / 1000; // kbps
        console.log(`Bandwidth: ${bandwidth} kbps`);

        // Adjust quality if needed
        if (bandwidth < 500) {
          degradeQuality();
        }
      }
    });
  }, 1000);
});
```

**[ẢNH: Screenshot của network stats overlay trong video call]**

#### F. Error Handling và Recovery

**Common Errors:**

```javascript
// Media access denied
navigator.mediaDevices.getUserMedia(constraints).catch((err) => {
  if (err.name === "NotAllowedError") {
    alert("Camera/microphone access denied. Please allow in browser settings.");
  } else if (err.name === "NotFoundError") {
    alert("No camera/microphone found.");
  } else {
    alert(`Media error: ${err.message}`);
  }
});

// Peer connection failed
peer.on("error", (err) => {
  console.error("Peer connection error:", err);

  if (err.code === "ERR_CONNECTION_FAILURE") {
    // Retry with TURN
    retryWithTurn();
  } else if (err.code === "ERR_DATA_CHANNEL") {
    // Recreate peer
    recreatePeerConnection();
  }
});

// ICE connection state monitoring
peer._pc.oniceconnectionstatechange = () => {
  console.log("ICE state:", peer._pc.iceConnectionState);

  switch (peer._pc.iceConnectionState) {
    case "disconnected":
      showReconnectingUI();
      break;
    case "failed":
      handleConnectionFailure();
      break;
    case "connected":
      hideReconnectingUI();
      break;
  }
};
```

**[ẢNH: Flowchart của error handling và recovery strategy]**

## 4.2 Công nghệ Frontend

### 4.2.1 React và Vite

#### A. React Library

**React v18.3.1** - JavaScript library for building user interfaces

**Key Features được sử dụng:**

1. **Functional Components**: Sử dụng hooks thay vì class components
2. **React Hooks**: useState, useEffect, useContext, useCallback, useMemo, useRef
3. **Context API**: Global state management
4. **React Router v7**: Client-side routing
5. **Code Splitting**: Lazy loading components

**Component Structure Example:**

```jsx
// CourseCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import styles from "./CourseCard.module.css";

const CourseCard = ({ course }) => {
  return (
    <Link to={`/courses/${course._id}`} className={styles.card}>
      <div className={styles.thumbnail}>
        <img
          src={course.thumbnail || "/default-thumbnail.jpg"}
          alt={course.title}
          loading="lazy"
        />
        {course.level && <span className={styles.badge}>{course.level}</span>}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{course.title}</h3>
        <p className={styles.description}>{course.description}</p>

        <div className={styles.footer}>
          <div className={styles.teacher}>
            <img src={course.teacher.avatar} alt={course.teacher.fullName} />
            <span>{course.teacher.fullName}</span>
          </div>

          <div className={styles.stats}>
            <span>⭐ {course.rating}</span>
            <span>👥 {course.enrolledStudents.length}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

CourseCard.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    thumbnail: PropTypes.string,
    level: PropTypes.string,
    rating: PropTypes.number,
    enrolledStudents: PropTypes.array,
    teacher: PropTypes.shape({
      fullName: PropTypes.string,
      avatar: PropTypes.string,
    }),
  }).isRequired,
};

export default CourseCard;
```

**[ẢNH: Screenshot của CourseCard component trong storybook hoặc live demo]**

#### B. Vite Build Tool

**Vite v7.1.7** - Next generation frontend tooling

**Advantages over Create React App:**

1. **Fast Cold Start**: Native ES modules, no bundling in dev
2. **Instant HMR**: Hot Module Replacement nhanh hơn
3. **Optimized Build**: Rollup-based production build
4. **Plugin Ecosystem**: Extensive plugin support

**Vite Configuration:**

```javascript
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@contexts": path.resolve(__dirname, "./src/contexts"),
    },
  },

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["framer-motion", "react-icons"],
          editor: ["react-quill"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
```

**Performance Optimizations:**

- Code splitting với React.lazy()
- Image lazy loading
- Bundle size optimization
- Tree shaking unused code

**[ẢNH: Screenshot của Vite dev server với HMR statistics]**

### 4.2.2 State Management và Routing

#### A. Context API for State Management

**AuthContext Example:**

```jsx
// contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (token) {
        try {
          const response = await axios.get("/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem("accessToken");
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const { user, tokens } = response.data;

      localStorage.setItem("accessToken", tokens.accessToken);
      setUser(user);

      toast.success("Login successful!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    toast.success("Logged out successfully");
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

**Other Contexts:**

- `CourseContext`: Course data và operations
- `NotificationContext`: Real-time notifications
- `SocketContext`: Socket.IO connections

**[ẢNH: Diagram showing Context API structure với multiple providers]**

#### B. React Router v7

**Routing Structure:**

```jsx
// routes/Router.jsx
import { createBrowserRouter } from "react-router-dom";
import Layout from "@components/layout/Layout";
import ProtectedRoute from "@components/ProtectedRoute";
import TeacherRoute from "@components/TeacherRoute";
import AdminRoute from "@components/AdminRoute";

// Lazy load pages
const HomePage = React.lazy(() => import("@pages/homepage/Home"));
const Login = React.lazy(() => import("@pages/auth/Login"));
const CourseDetail = React.lazy(() => import("@pages/courses/CourseDetail"));
const Dashboard = React.lazy(() =>
  import("@pages/dashboard/DashboardOverview")
);
const CreateCourse = React.lazy(() => import("@pages/courses/CreateCourse"));
const AdminDashboard = React.lazy(() => import("@pages/admin/AdminDashboard"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <Login /> },
      { path: "courses/:courseId", element: <CourseDetail /> },

      // Protected routes
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },

      // Teacher routes
      {
        path: "courses/create",
        element: (
          <TeacherRoute>
            <CreateCourse />
          </TeacherRoute>
        ),
      },

      // Admin routes
      {
        path: "admin",
        element: <AdminRoute />,
        children: [
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "users", element: <UserManagement /> },
        ],
      },
    ],
  },
]);

export default router;
```

**Route Protection:**

```jsx
// components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
```

**[ẢNH: Sitemap diagram showing all routes và protection levels]**

## 4.3 Dịch vụ bên thứ ba

### 4.3.1 Cloudinary - Media Storage

**Cloudinary Configuration:**

```javascript
// cloudinary.config.js
import { v2 as cloudinary } from "cloudinary";

export const connectCloudinary = async () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    // Test connection
    await cloudinary.api.ping();
    console.log("✅ Cloudinary connected successfully");
  } catch (error) {
    console.error("❌ Cloudinary connection failed:", error.message);
    throw error;
  }
};
```

**Features Used:**

- Image upload với automatic optimization
- Video upload với adaptive streaming
- Document storage (PDF, PPT, DOC)
- Transformation API (resize, crop, format conversion)
- CDN delivery

**Benefits:**

- Automatic WebP/AVIF conversion
- Responsive image delivery
- Video transcoding
- Global CDN
- Free tier: 25 GB storage, 25 GB bandwidth

**[ẢNH: Screenshot của Cloudinary dashboard với media library]**

### 4.3.2 SendGrid - Email Service

**SendGrid Configuration:**

```javascript
// sendGrid.config.js
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (to, subject, text, html) => {
  try {
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_SENDER_EMAIL,
        name: "E-Learning Platform",
      },
      subject,
      text,
      html,
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("SendGrid error:", error);
    throw error;
  }
};

// Email templates
export const sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const html = `
    <h1>Welcome to E-Learning Platform!</h1>
    <p>Hi ${user.fullName},</p>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verificationUrl}">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
  `;

  await sendEmail(user.email, "Verify Your Email", "", html);
};
```

**Email Types:**

- Welcome email
- Email verification
- Password reset
- Course enrollment confirmation
- Quiz completion notification
- Weekly activity summary

**[ẢNH: Screenshot của SendGrid dashboard với email statistics]**

## 4.4 Bảo mật hệ thống

### 4.4.1 Helmet.js - Security Headers

**Helmet.js Configuration:**

```javascript
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "https://accounts.google.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://accounts.google.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
```

**Security Headers Set:**

- X-DNS-Prefetch-Control
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)

**[ẢNH: Screenshot của browser DevTools showing security headers]**

### 4.4.2 Rate Limiting

**Rate Limiter Configuration:**

```javascript
// rateLimiter.js
import rateLimit from "express-rate-limit";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Max 5 login attempts per 15 minutes
  message: "Too many login attempts, please try again after 15 minutes.",
  skipSuccessfulRequests: true,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 uploads per hour
  message: "Upload limit exceeded, please try again later.",
});

// Usage
app.use("/api", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/lessons/upload", uploadLimiter);
```

### 4.4.3 Input Validation & Sanitization

**Validation với Joi:**

```javascript
import Joi from "joi";

export const validateCourseCreate = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(2000).required(),
    category: Joi.string()
      .valid(
        "Programming",
        "Frontend",
        "Backend",
        "Full Stack",
        "DevOps",
        "Data Science",
        "Machine Learning"
      )
      .required(),
    level: Joi.string()
      .valid("beginner", "intermediate", "advanced")
      .required(),
    price: Joi.number().min(0).default(0),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};
```

**XSS Protection:**

- HTML sanitization cho rich text input
- Escape output in templates
- Content Security Policy headers

**SQL Injection Protection:**

- Mongoose automatic query sanitization
- No raw queries với user input

**[ẢNH: Diagram showing validation flow: Request → Validation → Sanitization → Processing]**

## 4.5 Deployment và DevOps

### 4.5.1 Environment Configuration

**.env Structure:**

```bash
# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://elearning.example.com

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/elearning

# JWT
JWT_ACCESS_SECRET=your-strong-secret-key
JWT_ACCESS_EXPIRY=3h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SendGrid
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_SENDER_EMAIL=noreply@elearning.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4.5.2 Production Build

**Backend:**

```bash
# Package.json scripts
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "build": "echo 'No build step for Node.js'"
  }
}
```

**Frontend:**

```bash
# Build for production
npm run build

# Output: dist/ folder với optimized assets
```

**[ẢNH: Screenshot của production build output với bundle sizes]**

### 4.5.3 Deployment Options

**Potential Deployment Platforms:**

1. **Backend**:

   - Heroku
   - Render
   - Railway
   - AWS EC2
   - DigitalOcean

2. **Frontend**:

   - Vercel
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront

3. **Database**:
   - MongoDB Atlas (already configured)

**[ẢNH: Architecture diagram của deployed system với cloud services]**

---

**Kết luận phần 4:**

Hệ thống được xây dựng với tech stack hiện đại và mạnh mẽ: Node.js + Express cho backend, React + Vite cho frontend, MongoDB cho database, Socket.IO cho real-time features. Các dịch vụ bên thứ ba như Cloudinary và SendGrid được tích hợp để xử lý media và email. Bảo mật được đảm bảo với Helmet.js, rate limiting, input validation, và JWT authentication. Toàn bộ codebase được tổ chức tốt, dễ maintain và scale.
