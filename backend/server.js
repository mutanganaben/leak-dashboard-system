require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const nodeRoutes = require("./src/routes/nodeRoutes");
const alertRoutes = require("./src/routes/alertRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const settingsRoutes = require("./src/routes/settingsRoutes");
const readingRoutes = require("./src/routes/readingRoutes");
const simulationRoutes = require("./src/routes/simulationRoutes");
const errorHandler = require("./src/middleware/errorMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const apiRouter = express.Router();
apiRouter.use("/auth", authRoutes);
apiRouter.use("/nodes", nodeRoutes);
apiRouter.use("/alerts", alertRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/", settingsRoutes);
apiRouter.use("/readings", readingRoutes);
apiRouter.use("/simulation", simulationRoutes);
apiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", apiRouter);
app.use("/", apiRouter);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
