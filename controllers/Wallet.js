const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Wallet = require("../models/Wallet");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🛒 Create Payment Order (User Adds Money)
exports.createOrder = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount should be greater than zero" });
    }

    const options = {
      amount: amount * 100, // Convert to paisa
      currency: "INR",
      receipt: `order_rcptid_${userId}`,
    };

    console.log("Creating order with options:", options);

    const order = await razorpay.orders.create(options);

    console.log("Full order response from Razorpay:", order);

    res.json({ orderId: order.id, currency: order.currency, amount: order.amount });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 💳 Verify Payment and Add Money to Wallet
exports.verifyPayment = async (req, res) => {
    try {
      let { userId, bikeOwnerId, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
  
      // ✅ Convert IDs to ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(bikeOwnerId)) {
        return res.status(400).json({ error: "Invalid User ID or Bike Owner ID" });
      }
      userId = new mongoose.Types.ObjectId(userId);
      bikeOwnerId = new mongoose.Types.ObjectId(bikeOwnerId);
  
      // ✅ Find the user (customer)
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // ✅ Find the bike owner
      const bikeOwner = await User.findById(bikeOwnerId);
      if (!bikeOwner) {
        return res.status(404).json({ error: "Bike owner not found" });
      }
  
      // ✅ Verify Razorpay Payment Signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");
  
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }
  
      // ✅ Capture Payment
      await razorpay.payments.capture(razorpay_payment_id, amount, "INR");


      // ✅ Calculate Platform Fee (10%) & Bike Owner Earnings (90%)
      const platformFee = amount * 0.10; // 10%
      const bikeOwnerEarnings = amount * 0.90; // 90%
  
      // ✅ Update Bike Owner's Wallet
      bikeOwner.walletBalance += bikeOwnerEarnings / 100; // Convert paisa to rupees
      await bikeOwner.save();
  
      // ✅ Save Wallet Transaction for Bike Owner
      await Wallet.create({ userId: bikeOwnerId, amount: bikeOwnerEarnings / 100, type: "credit" });
  
      // ✅ Save Wallet Transaction for Platform Fee (You)
      await Wallet.create({ userId: "YOUR_PLATFORM_USER_ID", amount: platformFee / 100, type: "credit" });
  
      return res.json({
        success: true,
        message: "Payment verified successfully!",
        platformFee: platformFee / 100,
        bikeOwnerEarnings: bikeOwnerEarnings / 100,
        bikeOwnerBalance: bikeOwner.walletBalance
      });
  
    } catch (err) {
      console.error("Verification Error:", err);
      res.status(500).json({ error: "Server error" });
    }
  };
  