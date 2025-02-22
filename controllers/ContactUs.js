const { contactUsEmail } = require("../mail/templates/contactFormRes");
const mailSender = require("../utils/mailSender");
const Contact = require("../models/ContactUs"); // Import the Contact model

exports.contactUsController = async (req, res) => {
  const { email, fullName, message, phoneNo, countrycode } = req.body;

  // Validate required fields
  if (!email || !fullName || !message || !phoneNo || !countrycode) {
    return res.status(400).json({
      success: false,
      message: "All fields (email, fullName, message, phoneNo, countrycode) are required.",
    });
  }

  console.log("Contact Us Request Body: ", req.body);

  try {
    // Save contact form data to MongoDB
    const contactData = await Contact.create({
      fullName,
      email,
      message,
      phoneNo,
      countrycode,
    });
    console.log("Contact Data Saved to DB: ", contactData);

    // Send email confirmation
    const emailResponse = await mailSender(
      email, // Recipient's email
      "Contact Form Submission Confirmation", // Subject
      contactUsEmail(email, fullName, message, phoneNo, countrycode) // Email content
    );

    console.log("Email Response: ", emailResponse);

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully and saved to the database.",
    });
  } catch (error) {
    console.error("Error while handling Contact Us request:", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while handling your request. Please try again later.",
      error: error.message,
    });
  }
};
