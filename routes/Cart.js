const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const { addToCart, viewCart, removeFromCart, rentFromCart } = require("../controllers/Cart");

router.post("/add-cart", auth, addToCart);
router.get("/all-cart", auth, viewCart);
router.delete("/remove-from-cart", auth, removeFromCart);
router.post("/rent-bike", auth, rentFromCart);

module.exports = router;
