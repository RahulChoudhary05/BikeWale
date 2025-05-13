const Razorpay = require("razorpay");
const crypto = require("crypto");
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const Profile = require("../models/Profile");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.addFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentAmount = Number(amount) * 100;

    const options = {
      amount: paymentAmount,
      currency: "INR",
      receipt: "receipt#" + Math.floor(Math.random() * 10000),
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating Razorpay order",
      error: error.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount,
      } = req.body;
  
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
  
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed. Invalid signature",
        });
      }
  
      const userId = req.user.id;
  
      let wallet = await Wallet.findOne({ user: userId });
  
      if (!wallet) {
        wallet = new Wallet({ user: userId });
      }
  
      const amountNumber = Number(amount);
      if (isNaN(amountNumber)) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
      }
  
      wallet.balance += amountNumber;
      wallet.transactions.push({
        type: "credit",
        amount: amountNumber,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
  
      await wallet.save();
  
      // Update User wallet balance
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { walletBalance: wallet.balance },
        { new: true }
      );
  
      // Update Profile wallet balance using profile ID from user
      if (updatedUser?.profile) {
        await Profile.findByIdAndUpdate(
          updatedUser.profile,
          { walletBalance: wallet.balance }
        );
      }
  
      return res.status(200).json({
        success: true,
        message: "Funds added to wallet successfully",
        balance: wallet.balance,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to verify payment",
        error: error.message,
      });
    }
  };
  