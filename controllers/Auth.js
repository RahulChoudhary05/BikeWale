const bcrypt = require("bcrypt");
const OTP = require("../models/OTP");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();

// Signup Controller for Registering Users
exports.signup = async (req, res) => {
  try {
    const {
      fullName,
      email,
      contactNumber,
      drivingLicenseNo,
      password,
      confirmPassword,
      otp,
    } = req.body;

    // Check if all details are provided
    if (!fullName || !email || !contactNumber || !drivingLicenseNo || !password || !confirmPassword || !otp) {
      return res.status(400).json({ success: false, message: "All Fields are required" });
    }

    // Check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Password and Confirm Password do not match. Please try again." });
    }

    // Check if user already exists
    const existingUser  = await User.findOne({ email });
    if (existingUser ) {
      return res.status(400).json({ success: false, message: "User  already exists. Please sign in to continue." });
    }

    // Find the most recent OTP for the email
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord || otp !== otpRecord.otp) {
      return res.status(400).json({ success: false, message: "The OTP is not valid" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user with the same driving license number already exists
    const existingLicenseUser  = await User.findOne({ drivingLicenseNo });
    if (existingLicenseUser ) {
      return res.status(400).json({ success: false, message: "User  with this driving license number already exists. Please use a different driving license number." });
    }

    // Create the additional profile for user
    const profileDetails = await Profile.create({ gender: null, dateofBirth: null, about: null });

    // Create the user
    const user = await User.create({
      fullName,
      email,
      contactNumber,
      drivingLicenseNo,
      password: hashedPassword,
      additionalDetail: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${fullName}`,
    });

    // Return response with all necessary details
    return res.status(200).json({
      success: true,
      user: {
        fullName: user.fullName,
        email: user.email,
        contactNumber: user.contactNumber,
        drivingLicenseNo: user.drivingLicenseNo,
        active: user.active,
        additionalDetail: user.additionalDetail,
        image: user.image,
        _id: user._id,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      message: "User  registered successfully",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ success: false, message: "User  cannot be registered. Please try again." });
  }
};

// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user is already present
    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent) {
      return res.status(401).json({ success: false, message: "User is Already Registered" });
    }

    // Generate OTP
    let otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });

    // Create OTP record
    const otpPayload = { email, otp };
    await OTP.create(otpPayload);

    res.status(200).json({ success: true, message: "OTP Sent Successfully", otp });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Login controller for authenticating users
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please Fill up All the Required Fields" });
    }

    const user = await User.findOne({ email }).populate({ path: 'additionalDetail', options: { strictPopulate: false } });

    if (!user) {
      return res.status(401).json({ success: false, message: "User  is not Registered with Us Please SignUp to Continue" });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

      user.token = token;
      user.password = undefined;

      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({ success: true, token, user, message: "User  Login Success" });
    } else {
      return res.status(401).json({ success: false, message: "Password is incorrect" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Login Failure Please Try Again" });
  }
};

// Controller for Changing Password
exports.changePassword = async (req, res) => {
  try {
    const userDetails = await User.findById(req.user.id);
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);
    if (oldPassword === newPassword) {
      return res.status(400).json({ success: false, message: "New Password cannot be same as Old Password" });
    }

    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: "The password is incorrect" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "The password and confirm password do not match" });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(req.user.id, { password: encryptedPassword }, { new: true });

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Study Notion - Password Updated",
        passwordUpdated(updatedUserDetails.email, `Password updated successfully for ${updatedUserDetails.fullName}`)
      );
      console.log("Email sent successfully:", emailResponse.response);
    } catch (error) {
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({ success: false, message: "Error occurred while sending email", error: error.message });
    }

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({ success: false, message: "Error occurred while updating password", error: error.message });
  }
};