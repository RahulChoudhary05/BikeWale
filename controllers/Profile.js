const Profile = require("../models/Profile");
const User = require("../models/User");
const multer = require("multer");
const upload = multer({ dest: 'uploads/' });

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
    } else {
      return res.status(400).json({
          success: false,
          message: "drivingLicenseNo is required.", 
      });
    }

    await userDetails.save(); // Save updated User details

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

exports.updateDisplayPicture = async (req, res) => {
  try {
    upload.single('displayPicture')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({ success: false, message: 'File upload error' });
      } else if (err) {
        console.error('Unexpected error during upload:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

      // Log the incoming request to debug
      console.log('Request received for image upload');
      console.log('Request body:', req.body);
      console.log('Uploaded file:', req.file);

      const displayPicture = req.file;

      if (!displayPicture) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const userId = req.user.id;

      // TODO: Save file URL or path to the database for this user
      const fileUrl = '/uploads/' + displayPicture.filename; // Or your S3/cloud location

      console.log(User ${userId} uploaded profile picture: ${fileUrl});

      return res.status(200).json({
        success: true,
        message: 'Display picture updated successfully',
        file: displayPicture,
        fileUrl,
      });
    });
  } catch (error) {
    console.error('Unexpected error in controller:', error);
    return res.status(500).json({ success: false, message: 'Error updating display picture' });
  }
};
