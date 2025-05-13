const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const { addFunds, verifyPayment } = require("../controllers/Wallet");

router.post("/add-funds", auth, addFunds);
router.post("/verify-payment", auth, verifyPayment);

module.exports = router;
