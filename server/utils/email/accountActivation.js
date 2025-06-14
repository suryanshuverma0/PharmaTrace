// accountActivation.js
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};


// Generate activation token
const generateActivationToken = (userId, address) => {
  const payload = {
    userId: userId,
    address: address,
    type: 'activation',
    timestamp: Date.now()
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Create activation URL
const createActivationURL = (token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl}/activate-account?token=${token}`;
};

// Email HTML template
const getEmailTemplate = (userName, userRole, activationUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activate Your PharmaChain Account</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f7fa;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .welcome-section {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .welcome-section h2 {
                color: #2d3748;
                font-size: 24px;
                margin-bottom: 15px;
            }
            
            .user-info {
                background-color: #f7fafc;
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }
            
            .user-info h3 {
                color: #2d3748;
                margin-bottom: 10px;
                font-size: 18px;
            }
            
            .user-info p {
                color: #4a5568;
                margin-bottom: 8px;
            }
            
            .role-badge {
                display: inline-block;
                background-color: #667eea;
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                text-transform: capitalize;
                margin-top: 10px;
            }
            
            .activation-section {
                text-align: center;
                margin: 30px 0;
            }
            
            .activation-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 40px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }
            
            .activation-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            }
            
            .info-box {
                background-color: #e6fffa;
                border: 1px solid #81e6d9;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            
            .info-box h4 {
                color: #234e52;
                margin-bottom: 10px;
                font-size: 16px;
            }
            
            .info-box ul {
                color: #2d3748;
                padding-left: 20px;
            }
            
            .info-box li {
                margin-bottom: 5px;
            }
            
            .footer {
                background-color: #2d3748;
                color: #a0aec0;
                padding: 30px;
                text-align: center;
            }
            
            .footer p {
                margin-bottom: 10px;
            }
            
            .footer a {
                color: #667eea;
                text-decoration: none;
            }
            
            .security-note {
                background-color: #fff5f5;
                border: 1px solid #feb2b2;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
                color: #742a2a;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 8px;
                }
                
                .header, .content {
                    padding: 20px;
                }
                
                .header h1 {
                    font-size: 24px;
                }
                
                .activation-button {
                    padding: 14px 30px;
                    font-size: 14px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔗 PharmaChain</h1>
                <p>Blockchain-Based Pharmaceutical Supply Chain</p>
            </div>
            
            <div class="content">
                <div class="welcome-section">
                    <h2>Welcome to PharmaChain! 🎉</h2>
                    <p>Thank you for registering with our blockchain-based pharmaceutical tracking system.</p>
                </div>
                
                <div class="user-info">
                    <h3>📋 Registration Details</h3>
                    <p><strong>Name:</strong> ${userName}</p>
                    <p><strong>Role:</strong> <span class="role-badge">${userRole}</span></p>
                    <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                </div>
                
                <div class="activation-section">
                    <h3 style="margin-bottom: 20px; color: #2d3748;">🔐 Activate Your Account</h3>
                    <p style="margin-bottom: 25px; color: #4a5568;">
                        To complete your registration and start using PharmaChain, please activate your account by clicking the button below:
                    </p>
                    <a href="${activationUrl}" class="activation-button">
                        ✅ Activate My Account
                    </a>
                </div>
                
                <div class="info-box">
                    <h4>🚀 What's Next?</h4>
                    <ul>
                        <li>Click the activation button above</li>
                        <li>Complete your account verification</li>
                        <li>Access your personalized dashboard</li>
                        <li>Start tracking pharmaceutical products on the blockchain</li>
                    </ul>
                </div>
                
                <div class="security-note">
                    <strong>🔒 Security Note:</strong> This activation link will expire in 24 hours for your security. 
                    If you didn't create this account, please ignore this email.
                </div>
                
                <p style="text-align: center; margin-top: 30px; color: #4a5568;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${activationUrl}" style="color: #667eea; word-break: break-all;">${activationUrl}</a>
                </p>
            </div>
            
            <div class="footer">
                <p><strong>PharmaChain Team</strong></p>
                <p>Securing pharmaceutical supply chains with blockchain technology</p>
                <p>
                    <a href="#">Privacy Policy</a> | 
                    <a href="#">Terms of Service</a> | 
                    <a href="#">Support</a>
                </p>
                <p style="margin-top: 15px; font-size: 12px;">
                    © ${new Date().getFullYear()} PharmaChain. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Main function to send activation email
const sendActivationEmail = async (userDetails) => {
  try {
    const { userId, address, name, email, role } = userDetails;
    
    // Validate required fields
    if (!userId || !address || !name || !email) {
      throw new Error('Missing required user details for activation email');
    }
    
    // Generate activation token
    const activationToken = generateActivationToken(userId, address);
    
    // Create activation URL
    const activationUrl = createActivationURL(activationToken);
    
    // Create transporter
    const transporter = createTransporter();
    
    // Generate email HTML
    const emailHtml = getEmailTemplate(name, role || 'user', activationUrl);
    
    // Email options
    const mailOptions = {
      from: {
        name: 'PharmaChain',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🔗 Activate Your PharmaTrace Account - Welcome!',
      html: emailHtml,
      // Optional: Add text version for email clients that don't support HTML
      text: `
        Welcome to PharmaTrace, ${name}!
        
        Thank you for registering as a ${role || 'user'}.
        
        To activate your account, please click the following link:
        ${activationUrl}
        
        This link will expire in 24 hours for security reasons.
        
        If you didn't create this account, please ignore this email.
        
        Best regards,
        PharmaTrace Team
      `
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Activation email sent successfully');
    console.log('📧 Email sent to:', email);
    console.log('📨 Message ID:', info.messageId);
    console.log('🔗 Activation URL:', activationUrl);
    
    return {
      success: true,
      messageId: info.messageId,
      activationToken,
      activationUrl,
      message: 'Activation email sent successfully'
    };
    
  } catch (error) {
    console.error('❌ Error sending activation email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send activation email'
    };
  }
};

// Function to verify activation token
const verifyActivationToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is for activation
    if (decoded.type !== 'activation') {
      throw new Error('Invalid token type');
    }
    
    return {
      success: true,
      data: {
        userId: decoded.userId,
        address: decoded.address,
        timestamp: decoded.timestamp
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Test function to verify email configuration
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return { success: true, message: 'Email configuration verified' };
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendActivationEmail,
  verifyActivationToken,
  testEmailConfiguration,
  generateActivationToken,
  createActivationURL
};