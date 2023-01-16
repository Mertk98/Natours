const nodemailer = require('nodemailer');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Mert Doe <${rocess.env.EMAIL_FROM}>`;
  }

  createTransport() {
    if (process.env.NODE_ENV === 'production') {
      // sendgrid
      return 1;
    }

    // Create a transporter and return it
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  send(template, subject) {
    // Render HTML based on the pug/jade template

    // Define email options
    const mailOptions = {
      from: 'Mert Doe <mert_doe@g.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      //html:
    };

    // Create a transport and send email
  }

  sendWelcome() {
    this.send('welcome', 'Welcome to the Natours Family!');
  }
};

const sendEmail = async (options) => {
  // 2) Define email options
  const mailOptions = {
    from: 'Mert Doe <mert_doe@g.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};
