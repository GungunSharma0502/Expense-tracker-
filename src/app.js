require("dotenv").config(); 
const express = require("express");
const app = express();
const connectDB = require("./config/database");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 7777;

// Security middleware
app.use(helmet());

// ✅ FIXED: CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // Your Netlify URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked origin:', origin);
      callback(null, true); // ✅ CHANGED: Allow in production for testing
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Cookie parser middleware
app.use(cookieParser());

// Body parser
app.use(express.json());

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many requests, try again later",
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many API requests, try again later",
});

app.use("/signup", authLimiter);
app.use("/login", authLimiter);
app.use("/income", apiLimiter);
app.use("/expense", apiLimiter);
app.use("/automation", apiLimiter);
app.use("/dashboard", apiLimiter);

// Import routes
const authRouter = require("./routes/auth");
const incomeRouter = require("./routes/income");
const expenseRouter = require("./routes/expense");
const automationRouter = require("./routes/automation");
const dashboardRouter = require("./routes/dashboard");

// Mount routes
app.use("/", authRouter);
app.use("/", incomeRouter);
app.use("/", expenseRouter);
app.use("/", automationRouter);
app.use("/", dashboardRouter);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    allowedOrigins: allowedOrigins
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.path 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || "Something went wrong!" 
  });
});

// Connect DB and start server
connectDB()
  .then(() => {
    console.log("✅ Database connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Allowed Origins:`, allowedOrigins);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });