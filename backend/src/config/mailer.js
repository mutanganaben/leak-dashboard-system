const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an alert email notification.
 * @param {Object} alert - The alert document containing nodeName, pressure, level, createdAt
 */
const sendAlertEmail = async (alert) => {
  const { nodeName, pressure, level, createdAt } = alert;

  const mailOptions = {
    from: `"Water Leakage Simulation Monitor" <${process.env.EMAIL_USER}>`,
    to: process.env.ALERT_RECIPIENT_EMAIL,
    subject: `[${level.toUpperCase()}] Simulation Alert - Node: ${nodeName}`,
    text: `Simulated pressure reading of ${pressure} PSI detected on ${nodeName} at ${createdAt}. Level: ${level}.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: ${level === 'warning' ? '#ef4444' : '#f59e0b'};">
          [${level.toUpperCase()}] Alert Detected
        </h2>
        <p>A new simulated pressure alert has been triggered by the system.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Node Name:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${nodeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Pressure Reading:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${pressure} PSI</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Alert Level:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-transform: capitalize;">${level}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Timestamp:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${createdAt}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">Please check the <a href="http://localhost:3000/dashboard">monitoring dashboard</a> for more details.</p>
        <hr />
        <p style="font-size: 0.8em; color: #777;">This is an automated message from the Water Leakage Simulation Monitor.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Alert email sent: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending alert email:', error);
  }
};

module.exports = { sendAlertEmail };
