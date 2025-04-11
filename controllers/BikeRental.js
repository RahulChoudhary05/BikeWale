const AddBikeRent = require("../models/AddBikeOnRent");
const User = require("../models/User");
const HowManyTimeBikeRent = require("../models/HowManyTimeBikeRent");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const Profile = require("../models/Profile");

exports.addBikeOnRental = async (req, res) => {
  try {
    const { typeofbike, bikemodel, about, registeredBikeNo, rentprice, tag } = req.body;

    // Validate if bikepic file exists in the request
    if (!req.files || !req.files.bikepic) {
      return res.status(400).json({
        success: false,
        message: "Bike image is required!",
      });
    }

    const userId = req.user.id;

    // Log the user object for debugging
    console.log("User  object:", req.user);

    // Check if profile ID exists
    if (!req.user.profile) {
      return res.status(400).json({
        success: false,
        message: "User  profile is required.",
      });
    }

    // Upload the image to Cloudinary
    const uploadedImage = await uploadImageToCloudinary(req.files.bikepic, "BikePictures");

    // Create a new bike rental entry
    const newBike = await AddBikeRent.create({
      typeofbike,
      bikemodel,
      about,
      registeredBikeNo,
      rentprice,
      bikepic: uploadedImage.secure_url, // Save the URL of the uploaded image
      tag: JSON.parse(tag), // Ensure tag is parsed to an array
      profile: req.user.profile, // Ensure the profile ID is correctly set
    });

    // Update the user's profile to include the bike
    const updatedProfile = await Profile.findByIdAndUpdate(
      req.user.profile, // Use the profile ID from the user
      { $push: { bikesCreated: newBike._id } }, // Push the bike ID to the user's created list
      { new: true }
    );

    return res.status(201).json({
      success: true,
      message: "Bike added successfully",
      data: { bike: newBike, profile: updatedProfile },
    });
  } catch (error) {
    console.error("Error in addBikeOnRental:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding the bike",
      error: error.message,
    });
  }
};

// Edit bike details
exports.editBikeDetails = async (req, res) => {
  try {
    const { bikeID } = req.params; // Get the bikeID from route params
    const updates = req.body; // All other updates from the body

    // Find the bike in the database
    const bike = await AddBikeRent.findById(bikeID);

    // If the bike is not found, return a 404 error
    if (!bike) {
      return res.status(404).json({ success: false, message: "Bike not found" });
    }

    // Check if the requesting user is authorized to update the bike
    if (req.user.id !== bike.profile.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized action" });
    }

    // Handle the bike image if a new one is uploaded
    if (req.files?.bikeImage) {
      const uploadedImage = await uploadImageToCloudinary(req.files.bikeImage, process.env.FOLDER_NAME);
      updates.bikepic = uploadedImage.secure_url;
    }

    // Update the bike details
    for (const key in updates) {
      if (key === "tag") {
        try {
          // Try parsing as JSON if it's a JSON string
          bike[key] = JSON.parse(updates[key]);
        } catch (error) {
          // Otherwise, treat it as a regular string
          bike[key] = updates[key];
        }
      } else {
        bike[key] = updates[key]; // Otherwise, directly assign the value
      }
    }

    // Save the updated bike
    await bike.save();

    return res.status(200).json({
      success: true,
      message: "Bike details updated successfully",
      data: bike,
    });
  } catch (error) {
    console.error("Error editing bike details:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to edit bike details",
      error: error.message,
    });
  }
};


// Delete bike rental
exports.deleteBike = async (req, res) => {
  try {
    const { bikeID } = req.params; // Extract bikeID from params

    // Fetch the bike from the database
    const bike = await AddBikeRent.findById(bikeID);

    // Check if the bike exists
    if (!bike) {
      return res.status(404).json({
        success: false,
        message: "Bike not found",
      });
    }

    // Check if user is authorized to delete the bike
    if (!req.user || !req.user.id || req.user.id !== bike.profile.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized action",
      });
    }

    // Delete the bike
    await bike.deleteOne();

    // Update the user's references (remove the bikeID from the user's addBikeRental)
    await User.findByIdAndUpdate(req.user.id, { $pull: { addBikeRental: bikeID } });

    return res.status(200).json({
      success: true,
      message: "Bike deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting bike:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all bikes with user profile data
exports.getAllBikes = async (req, res) => {
  try {
    const allBikes = await AddBikeRent.find() // Fetch all bikes
      .populate({
        path: "profile", // Populate the profile field
        select: "fullName email contactNumber profileImage upiId", // Select the fields you want from the Profile model
      })
      .select("typeofbike bikemodel about rentprice registeredBikeNo bikepic tag"); // Select the fields you want from the AddBikeRent model

    console.log("All Bikes (with profiles):", allBikes);

    if (allBikes.length === 0) {
      return res.status(200).json({ success: true, data: [], message: "No bikes found" });
    }

    return res.status(200).json({ success: true, data: allBikes });
  } catch (error) {
    console.error("Error fetching all bikes:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch bikes", error: error.message });
  }
};


// Get full bike details
exports.getFullBikeDetails = async (req, res) => {
  try {
    const { bikeID } = req.body;
    const userId = req.user.id;

    const bikeDetails = await AddBikeRent.findById(bikeID)
      .populate("ratingAndReviews")
      .populate("bikeContent")
      .exec();

    if (!bikeDetails) {
      return res.status(404).json({ success: false, message: "Bike not found" });
    }

    const rentHistory = await HowManyTimeBikeRent.findOne({ bikeID, userID: userId });
    return res.status(200).json({ success: true, data: { bikeDetails, rentHistory: rentHistory?.completedRent || [] } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to get full bike details", error: error.message });
  }
};

// Fetch Bike Details
exports.getBikeDetails = async (req, res) => {
  try {
    const { bikeID } = req.params;

    if (!bikeID) {
      return res.status(400).json({ success: false, message: "Bike ID is required" });
    }

    // Populate profile (which is from Profile model, not User)
    const bikeDetails = await AddBikeRent.findById(bikeID)
      .populate({
        path: "profile",
        model: "Profile", // ensure you're referencing the Profile model
        select: "fullName email contactNumber profileImage", // adjust based on actual schema
      })
      .exec();

    if (!bikeDetails) {
      return res.status(404).json({ success: false, message: "Bike not found" });
    }

    return res.status(200).json({
      success: true,
      data: bikeDetails,
    });
  } catch (error) {
    console.error("Error fetching bike details:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get bike details",
      error: error.message,
    });
  }
};

exports.rentBike = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bikeID } = req.params;

    // Fetch the bike
    const bike = await AddBikeRent.findById(bikeID);
    if (!bike) {
      return res.status(404).json({ success: false, message: "Bike not found" });
    }

    // Update Profile to include bike in rental history
    const userProfile = await Profile.findOneAndUpdate(
      { _id: req.user.profile },
      { $push: { bikesRented: { bike: bikeID, rentedAt: new Date() } } },
      { new: true }
    );

    // Mark bike rented by adding the user to BikeAvailable
    bike.BikeAvailable.push(userId);
    await bike.save();

    return res.status(200).json({
      success: true,
      message: "Bike rented successfully",
      bike,
    });
  } catch (error) {
    console.error("Error renting bike:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while renting the bike",
      error: error.message,
    });
  }
};

exports.updateHowManyTimeBikeRent = async (req, res) => {
  try {
    const { bikeID } = req.params;

    // Find and update the bike usage count
    const bike = await AddBikeRent.findByIdAndUpdate(
      bikeID,
      { $inc: { totalTimesRented: 1 } }, // Increment the rental count by 1
      { new: true }
    );

    // Check if the bike exists
    if (!bike) {
      return res.status(404).json({
        success: false,
        message: "Bike not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bike rental count updated successfully",
      data: bike,
    });
  } catch (error) {
    console.error("Error updating bike rental count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update bike rental count",
      error: error.message,
    });
  }
};
