const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Upload image to Cloudinary
exports.uploadImageToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder || "default", // Specify folder or use default
      resource_type: "auto", // Auto-detect the resource type
    });
    return result; // Upload successful
  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error.message);
    throw new Error("Image upload failed");
  }
};
