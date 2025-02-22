const mongoose = require("mongoose");

const HowManyTimeBikeRentProgress = new mongoose.Schema({
    bikeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AddBikeRent",
    },
});

module.exports = mongoose.model("HowManyTimeBikeRent", HowManyTimeBikeRentProgress);
