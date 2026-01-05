require("dotenv").config(); 
const express = require("express");
const app = express();
const connectDB = require("./config/database");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Cookie parser middleware (IMPORTANT for authentication)
app.use(cookieParser());

// Body parser
app.use(express.json());

// Rate limiting for specific routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: "Too many requests, try again later",
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many API requests, try again later",
});

// Apply rate limiting to auth routes
app.use("/signup", authLimiter);
app.use("/login", authLimiter);

// Apply general rate limiting to API routes
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
app.use("/", authRouter);           // Auth routes: /signup, /login, /logout, /profile
app.use("/", incomeRouter);         // Income routes: /income
app.use("/", expenseRouter);        // Expense routes: /expense
app.use("/", automationRouter);     // Automation routes: /automation
app.use("/", dashboardRouter);      // Dashboard routes: /dashboard

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found" 
  });
});

// Global error handling middleware
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
    app.listen(7777, () => {
      console.log("🚀 Server is running on http://localhost:7777");
      console.log("\n📝 AVAILABLE ROUTES:");
      console.log("\n🔐 AUTH ROUTES:");
      console.log("   POST   /signup");
      console.log("   POST   /login");
      console.log("   POST   /logout");
      console.log("   GET    /profile");
      console.log("   GET    /check-auth");
      console.log("\n💰 INCOME ROUTES:");
      console.log("   POST   /income              - Add new income");
      console.log("   GET    /income              - Get all incomes");
      console.log("   GET    /income/:id          - Get single income");
      console.log("   PATCH  /income/:id          - Update income");
      console.log("   DELETE /income/:id          - Delete income");
      console.log("   GET    /income/total/sum    - Get total income");
      console.log("\n💸 EXPENSE ROUTES:");
      console.log("   POST   /expense             - Add new expense");
      console.log("   GET    /expense             - Get all expenses");
      console.log("   GET    /expense/:id         - Get single expense");
      console.log("   PATCH  /expense/:id         - Update expense");
      console.log("   DELETE /expense/:id         - Delete expense");
      console.log("   GET    /expense/total/sum   - Get total expense");
      console.log("\n🤖 AUTOMATION ROUTES:");
      console.log("   POST   /automation          - Create automation");
      console.log("   GET    /automation          - Get all automations");
      console.log("   GET    /automation/:id      - Get single automation");
      console.log("   PATCH  /automation/:id      - Update automation");
      console.log("   DELETE /automation/:id      - Delete automation");
      console.log("   PATCH  /automation/:id/toggle    - Toggle active status");
      console.log("   POST   /automation/:id/process   - Process automation");
      console.log("\n📊 DASHBOARD ROUTES:");
      console.log("   GET    /dashboard/summary              - Complete summary");
      console.log("   GET    /dashboard/expense-by-category  - Expense breakdown");
      console.log("   GET    /dashboard/income-by-category   - Income breakdown");
      console.log("   GET    /dashboard/monthly-trends       - Monthly trends");
      console.log("   GET    /dashboard/recent-transactions  - Recent transactions");
      console.log("\n✅ Health Check:");
      console.log("   GET    /health");
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });