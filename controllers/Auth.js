const bcrypt = require("bcrypt");
const OTP = require("../models/OTP");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();


// function isValidDrivingLicenseNumber(drivingLicenseNo) {
//   // Regular expression to check valid Indian driving license numbers
//   const regex = /^(([A-Z]{2}[0-9]{2})( )|([A-Z]{2}-[0-9]{2}))((19|20)[0-9][0-9])[0-9]{7}$/;

//   return regex.test(drivingLicenseNo);
// }

// Signup Controller for Registering USers
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
    if (
      !fullName ||
      !email ||
      !contactNumber ||
      !drivingLicenseNo ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message: "All Fields are required",
      });
    }

    // Check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match. Please try again.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in to continue.",
      });
    }

    // Find the most recent OTP for the email
    const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
    if (response.length === 0 || otp !== response[0].otp) {
      // OTP not found for the email or invalid OTP
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate the driving license number
    // if (!isValidDrivingLicenseNumber(drivingLicenseNo)) {
    //   return res.status(400).json({ success: false, message: "Invalid Indian driving license number format" });
    // }

    // Check if user with the same driving license number already exists
    const existingLicenseUser = await User.findOne({ drivingLicenseNo });
    if (existingLicenseUser) {
      return res.status(400).json({
        success: false,
        message: "User with this driving license number already exists. Please use a different driving license number.",
      });
    }

    // Create the additional profile for user
    const profileDetails = await Profile.create({
      gender: null,
      dateofBirth: null,
      about: null,
    });

    // Create the user with the validated driving license and contact number
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
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    });
  }
};


// Login controller for authenticating users
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate user credentials
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide email and password" 
      });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1d", // Token expires in 1 day
    });

    // Set token in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevents JavaScript from accessing cookies
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict", // Prevents CSRF attacks
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
    });

    // Optional: Return user details and success message
    res.status(200).json({
      success: true,
      message: "Login successful",
      token, // Return the token for reference
      user,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred during login",
    });
  }
};


// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user is already present
    // Find user with provided email
    const checkUserPresent = await User.findOne({ email });
    // to be used in case of signup

    // If user found with provided email
    if (checkUserPresent) {
      // Return 401 Unauthorized status code with error message
      return res.status(401).json({
        success: false,
        message: `User is Already Registered`,
      });
    }

    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const result = await OTP.findOne({ otp: otp });
    console.log("Result is Generate OTP Func");
    console.log("OTP", otp);
    console.log("Result", result);
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
    }
    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);
    console.log("OTP Body", otpBody);
    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully`,
      otp,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Controller for Changing Password
exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id);

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New Password cannot be same as Old Password",
      });
    }

    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" });
    }

    // Match new password and confirm new password
    if (newPassword !== confirmNewPassword) {
      // If new password and confirm new password do not match, return a 400 (Bad Request) error
      return res.status(400).json({
        success: false,
        message: "The password and confirm password does not match",
      });
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Study Notion - Password Updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.fullName}`
        )
      );
      console.log("Email sent successfully:", emailResponse.response);
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    });
  }
};
