const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

exports.auth = async (req, res, next) => {
  try {
    let token;

    // First, check the Authorization header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } 
    // Fallback to checking the HttpOnly Cookie
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token is found in headers or cookies
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: Missing token" 
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded user object to the request
    next(); // Allow the request to continue
  } catch (error) {
    console.error("JWT error", error.message);
    return res.status(403).json({ 
      success: false, 
      message: "Invalid or expired token" 
    });
  }
};
