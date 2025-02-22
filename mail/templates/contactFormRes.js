exports.contactUsEmail = (email, fullName, message, phoneNo, countrycode) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Contact Form Confirmation</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  font-size: 16px;
                  color: #333;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  text-align: left;
              }
              .message {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 20px;
              }
              .info {
                  font-size: 16px;
                  margin-bottom: 20px;
              }
          </style>
      </head>
      <body>
        <div class="container">
          <h2>Contact Form Confirmation</h2>
          <p>Hello ${fullName},</p>
          <p>Thank you for contacting us. We have received the following details:</p>
          <p><strong>Full Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${countrycode} ${phoneNo}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p>We will get back to you shortly. If you have further questions, please email us at <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>.</p>
        </div>
      </body>
      </html>
    `;
  };
  