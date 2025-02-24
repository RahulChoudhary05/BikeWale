const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const database = require("./config/database");

// Importing Routes
const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const bikeRoutes = require("./routes/Bike");
const contactUsRoute = require("./routes/Contact");

// Configuration
dotenv.config();
const PORT = process.env.PORT || 4000;

// Database Connection
database.connect();

// Middleware Setup
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "https://bikewale-wyxw.onrender.com", credentials: true })); // Adjust the origin for production
app.use(
  fileUpload({
    useTempFiles: true, // Enable temporary file use
    tempFileDir: "/tmp/", // Directory to store temporary files (you can customize this path)
    createParentPath: true, // Create directory automatically if it doesn't exist
    limits: { fileSize: 10 * 1024 * 1024 }, // Set file size limit (optional, e.g., 10 MB)
  })
);


// Routes Setup
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/bike", bikeRoutes); // Bike routes
app.use("/api/v1/reach", contactUsRoute);

// Default Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Your server is up and running...",
  });
});

// Error Handling for Undefined Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: "An internal server error occurred",
  });
});


// Start Server
app.listen(PORT, () => {
  console.log(`App is running at port ${PORT}`);
});
