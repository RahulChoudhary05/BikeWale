const Profile = require("../models/Profile");
const User = require("../models/User");
const multer = require("multer");
const upload = multer({ dest: 'uploads/' });

// Updated code to handle edge cases properly
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateofBirth = "",
      about = "",
      contactNumber = "",
      gender = "",
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

    // Update user's details if provided
    if (firstName) userDetails.firstName = firstName;
    if (lastName) userDetails.lastName = lastName;
    await userDetails.save();

    // Update profile details
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    profile.dateofBirth = dateofBirth;
    profile.about = about;
    profile.contactNumber = contactNumber;
    profile.gender = gender;
    await profile.save();

    // Return the updated details
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
    // Retrieve user ID from request object (set in auth middleware)
    const userId = req.user.id;

    // Fetch user details and populate related fields
    const user = await User.findById(userId).populate('additionalDetail');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Send success response with user profile data
    res.status(200).json({
      success: true,
      user, // Return entire user profile
    });
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};


exports.updateDisplayPicture = async (req, res) => {
  try {
    upload.single('displayPicture')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: 'File upload error' });
      } else if (err) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

      // Process the uploaded file and update the display picture in the database
      const displayPicture = req.file;
      const userId = req.user.id;
      // Your logic to handle the file and update the display picture in the database
      // Example: save the file URL to the user's profile

      return res.status(200).json({
        success: true,
        message: 'Display picture updated successfully',
        file: displayPicture,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error updating display picture' });
  }
};
