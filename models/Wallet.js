const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  type: { type: String, enum: ["credit", "debit"], required: true }, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Wallet", WalletSchema);
