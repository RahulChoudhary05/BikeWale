const Cart = require("../models/Cart");
const AddBikeRent = require("../models/AddBikeOnRent");
const Rental = require("../models/Rental");
const User = require("../models/User");

exports.addToCart = async (req, res) => {
  const { bikeId } = req.body;
  const userId = req.user.id;

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.bikeId.toString() === bikeId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({ bikeId, quantity: 1 });
    }

    await cart.save();
    res.status(200).json({ success: true, message: "Bike added to cart", cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Failed to add to cart", error: error.message });
  }
};

exports.viewCart = async (req, res) => {
  const userId = req.user.id;

  try {
    const cart = await Cart.findOne({ userId }).populate("items.bikeId");
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Error viewing cart:", error);
    res.status(500).json({ success: false, message: "Failed to view cart", error: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  const { bikeId } = req.body;
  const userId = req.user.id;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(item => item.bikeId.toString() !== bikeId);
    await cart.save();

    res.status(200).json({ success: true, message: "Bike removed from cart", cart });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ success: false, message: "Failed to remove from cart", error: error.message });
  }
};

exports.rentFromCart = async (req, res) => {
    const userId = req.user.id;
  const { bikeId, hours } = req.body;

  if (!bikeId || !hours) {
    return res.status(400).json({ success: false, message: "bikeId and hours are required" });
  }
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      const cart = await Cart.findOne({ userId }).populate("items.bikeId");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }
  
      const cartItem = cart.items.find(item => item.bikeId._id.toString() === bikeId);
      if (!cartItem) {
        return res.status(400).json({ success: false, message: "Bike not found in cart" });
      }
  
      const bike = await AddBikeRent.findById(bikeId);
      if (!bike) {
        return res.status(404).json({ success: false, message: "Bike not found" });
      }
  
      const totalPrice = bike.rentprice * hours;
      if (user.walletBalance < totalPrice) {
        return res.status(400).json({ success: false, message: "Insufficient funds in wallet" });
      }
  
      user.walletBalance -= totalPrice;
      await user.save();
  
      await Rental.create({
        renterId: userId,
        ownerId: bike.profile,
        bikeId: bike._id,
        hours: hours,
        totalPrice: totalPrice,
      });
  
      cart.items = cart.items.filter(item => item.bikeId.toString() !== bikeId);
      await cart.save();
  
      res.status(200).json({ success: true, message: "Bike rented successfully", totalPrice });
    } catch (error) {
      console.error("Error renting from cart:", error);
      res.status(500).json({ success: false, message: "Failed to rent bike", error: error.message });
    }
  };
  