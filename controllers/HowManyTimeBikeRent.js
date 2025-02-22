const mongoose = require("mongoose")
const HowManyTimeBikeRent = require("../models/HowManyTimeBikeRent");

exports.updateHowManyTimeBikeRent = async (req, res) => {
    const { bikeID } = req.body;
    const userID = req.user.id;

    try {
        // Find the course progress document for the user and course
        let bikeRent = await HowManyTimeBikeRent.findOne({
            bikeID: bikeID, // Corrected from bikrID to bikeID
            userID: userID,
        });

        if (!bikeRent) {
            // If bike rent doesn't exist, create a new one
            return res.status(404).json({
                success: false,
                message: "Bike Rent Does Not Exist",
            });
        }

        // Update the bike rent progress if needed (implement any updates here)
        // For example, incrementing a rental count:
        bikeRent.rentalCount += 1; // This line is an example, replace with actual logic

        // Save the updated bike rent
        await bikeRent.save();
        return res.status(200).json({ success: true, message: "Bike Rental updated" });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
