const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User ", required: true },
  items: [
    {
      bikeId: { type: mongoose.Schema.Types.ObjectId, ref: "AddBikeRent", required: true },
      quantity: { type: Number, default: 1 },
      addedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Cart", cartSchema);
