const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

exports.auth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ success: false, message: "Authentication failed" });
  }
};
