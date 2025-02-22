const express = require("express");
const router = express.Router();
const { contactUsController } = require("../controllers/ContactUs");

// Define the route for "Contact Us"
router.post("/contact", contactUsController);

module.exports = router;
