const cloudinary = require("cloudinary").v2;
require("dotenv").config(); // Ensure .env variables are loaded

// **DEBUG LOG**: Log Cloudinary configuration
console.log("Cloudinary Configuration: ", {
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET ? "***" : "MISSING", // Mask the secret for security
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Upload Utility Function
exports.uploadImageToCloudinary = async (file, folder = "BikeWale", height, quality) => {
  if (!file || !file.tempFilePath) {
    throw new Error("File or tempFilePath is missing.");
  }

  const options = { folder, resource_type: "auto" }; // Default upload options
  if (height) options.height = height;
  if (quality) options.quality = quality;

  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, options); // Upload image
    console.log("Image uploaded successfully:", result.url); // Log success
    return result;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message); // Log Cloudinary error
    throw new Error("Image upload failed");
  }
};
