const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const { deleteAccount, updateProfile, getAllUserDetails, updateDisplayPicture } = require("../controllers/Profile");

const app = express();
app.use(express.json());
app.use(require("cookie-parser")()); 

// Profile routes
router.delete("/delete-profile", auth, deleteAccount); // DELETE /profile to delete account
router.put("/update-profile", auth, updateProfile); // PUT /profile to update profile
router.get("/details", auth, getAllUserDetails); // GET /profile/details to fetch user details
router.put("/display-picture", auth, updateDisplayPicture); // PUT /profile/display-picture to update the display picture

module.exports = router;
