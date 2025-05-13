const Profile = require("../models/Profile");
const User = require("../models/User");
const multer = require("multer");
const cloudinary = require("cloudinary").v2; 
const Wallet = require("../models/Wallet");

// Updated code to handle edge cases properly
exports.updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      contactNumber,
      dateofBirth = "",
      about = "",
      gender = "",
      upiId = "",
      drivingLicenseNo,
    } = req.body;

    const id = req.user.id;

    // Find the user and populate additionalDetail
    const userDetails = await User.findById(id).populate("additionalDetail").exec();
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Handle additionalDetail (array or single object)
    const profileData = Array.isArray(userDetails.additionalDetail)
      ? userDetails.additionalDetail[0]
      : userDetails.additionalDetail;

    if (!profileData || !profileData._id) {
      return res.status(404).json({
        success: false,
        message: "Profile associated with user not found",
      });
    }

    const profileId = profileData._id;

    // Update User details
    let hasUpdated = false;

    if (fullName) {
      userDetails.fullName = fullName;
      hasUpdated = true;
    }

    if (contactNumber) {
      userDetails.contactNumber = contactNumber;
      hasUpdated = true;
    }

    if (drivingLicenseNo) {
      userDetails.drivingLicenseNo = drivingLicenseNo;
      hasUpdated = true;
    }

    if (hasUpdated) {
      await userDetails.save(); // Save updated User details
    }

    // Update Profile details
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Update profile fields, only if provided
    if (dateofBirth) profile.dateofBirth = dateofBirth;
    if (about) profile.about = about;
    if (gender) profile.gender = gender;
    if (upiId) profile.upiId = upiId;
    if (contactNumber) profile.contactNumber = contactNumber;

    await profile.save(); // Save updated Profile details

    // Return the updated user details
    const updatedUserDetails = await User.findById(id).populate("additionalDetail").exec();
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the profile",
      error: error.message,
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const id = req.user.id;

    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete associated profile
    await Profile.findByIdAndDelete(userDetails.additionalDetail);

    // Delete the user
    await User.findByIdAndDelete(id);

    // Delete the wallet
    await Wallet.findOneAndDelete({ user: id });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete Account Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the account",
      error: error.message,
    });
  }
};

exports.getAllUserDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user and profile details
    const userDetails = await User.findById(userId)
      .populate("additionalDetail") // Profile linked to User
      .populate({
        path: "additionalDetail",
        populate: [
          { path: "bikesCreated", model: "AddBikeRent" }, // Bikes Created
          { path: "bikesRented.bike", model: "AddBikeRent" }, // Rental history
        ],
      });

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      userDetails,
    });
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching user details",
      error: error.message,
    });
  }
};

// Controller function to handle the display picture update
exports.updateDisplayPicture = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if file is uploaded
    if (!req.files || !req.files.displayPicture) {
      return res.status(400).json({
        success: false,
        message: "No display picture file uploaded",
      });
    }

    const file = req.files.displayPicture;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "ProfilePictures",
      resource_type: "image",
    });

    const imageUrl = result.secure_url;

    // 1. Update image in Profile model
    const profileUpdate = await Profile.findOneAndUpdate(
      { _id: req.user.additionalDetail }, // Match Profile ID
      { displayPicture: imageUrl },
      { new: true }
    );

    // 2. Update image in User model
    const userUpdate = await User.findByIdAndUpdate(
      userId,
      { image: imageUrl },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Display picture updated successfully",
      imageUrl,
      profile: profileUpdate,
      user: userUpdate,
    });
  } catch (err) {
    console.error("❌ Error updating display picture:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating display picture",
      error: err.message,
    });
  }
};
