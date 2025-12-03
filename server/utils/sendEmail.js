const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // Use App Password, not regular password
  },
});

const sendEmail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: `"PharmaTrace System" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    };

    console.log('=== EMAIL SENDING ===');
    console.log('From:', process.env.GMAIL_USER);
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text Preview:', text.substring(0, 100) + '...');
    console.log('HTML Email:', html ? 'Yes' : 'No');
    console.log('Gmail Auth User:', process.env.GMAIL_USER ? 'Configured' : 'Missing');
    console.log('Gmail App Password:', process.env.GMAIL_PASS ? 'Configured (' + process.env.GMAIL_PASS.length + ' chars)' : 'Missing');
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('To:', to);
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('Envelope:', info.envelope);
    console.log('===================');
    
    return { success: true, message: 'Email sent successfully', messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed!');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Response:', error.response);
    console.error('Full Error:', error);
    console.error('===================');
    return { 
      success: false, 
      message: 'Error sending email', 
      error: error.message || error 
    };
  }
};

// Specific email templates for different scenarios
const emailTemplates = {
  pharmacyIssueReport: (pharmacyName, batchId, productName, issueDetails) => {
    const subject = `🚨 URGENT: Product Issue Report - Batch ${batchId}`;
    const text = `
URGENT PRODUCT ISSUE REPORT

Pharmacy: ${pharmacyName}
Batch ID: ${batchId}
Product: ${productName}

Issue Details:
${issueDetails}

This issue was reported during receipt confirmation. Please investigate immediately and take necessary action.

This is an automated message from PharmaTrace Supply Chain System.
`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 20px;">
          <h2 style="color: #dc2626; margin: 0;">🚨 URGENT: Product Issue Report</h2>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #374151; margin-top: 0;">Issue Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Pharmacy:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${pharmacyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Batch ID:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${batchId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Product:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${productName}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #92400e; margin-top: 0;">Reported Issues:</h4>
          <p style="color: #92400e; margin: 0;">${issueDetails}</p>
        </div>
        
        <div style="background-color: #dbeafe; padding: 16px; border-radius: 8px;">
          <p style="color: #1e40af; margin: 0;"><strong>Action Required:</strong> Please investigate immediately and take necessary corrective action.</p>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          This is an automated message from PharmaTrace Supply Chain System.<br>
          Do not reply to this email.
        </p>
      </div>
    `;
    
    return { subject, text, html };
  },

  receiptConfirmation: (pharmacyName, batchId, productName, quantity) => {
    const subject = `✅ Receipt Confirmed - Batch ${batchId}`;
    const text = `
Receipt Confirmation

Pharmacy: ${pharmacyName}
Batch ID: ${batchId}
Product: ${productName}
Quantity: ${quantity} units

The above batch has been successfully received and confirmed by the pharmacy.

This is an automated message from PharmaTrace Supply Chain System.
`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 16px; margin-bottom: 20px;">
          <h2 style="color: #16a34a; margin: 0;">✅ Receipt Confirmation</h2>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #374151; margin-top: 0;">Delivery Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Pharmacy:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${pharmacyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Batch ID:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${batchId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Product:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${productName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Quantity:</strong></td>
              <td style="padding: 8px 0;">${quantity} units</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #dcfce7; padding: 16px; border-radius: 8px;">
          <p style="color: #16a34a; margin: 0;"><strong>Status:</strong> Successfully received and confirmed by pharmacy.</p>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          This is an automated message from PharmaTrace Supply Chain System.<br>
          Do not reply to this email.
        </p>
      </div>
    `;
    
    return { subject, text, html };
  }
};

module.exports = {
  sendEmail,
  emailTemplates
};