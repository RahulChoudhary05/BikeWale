const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error("MongoDB URL is missing.");
    }

    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("DB connection successful!");
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1); // Exit process with failure
  }
};
