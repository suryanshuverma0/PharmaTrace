# Email Functionality Implementation

This implementation adds comprehensive email functionality to the PharmaTrace system using SendGrid.

## Features Implemented

### 1. Email Utility Function (`server/utils/sendEmail.js`)
- SendGrid integration for reliable email delivery
- Pre-built email templates for common scenarios
- Error handling and logging
- HTML and text email support

### 2. Email Templates
- **Pharmacy Issue Report**: Sent to distributors when pharmacies report issues during receipt confirmation
- **Receipt Confirmation**: Sent to distributors when pharmacies successfully confirm receipt

### 3. Automatic Email Triggers
- **Damage Reported**: When a pharmacy reports damage during receipt confirmation, an issue report email is automatically sent to the distributor
- **Successful Receipt**: When a pharmacy confirms receipt without issues, a confirmation email is sent to the distributor

### 4. Enhanced Pharmacy Inventory
- **Expandable Interface**: Similar to distributor's assigned batches page
- **Product Details**: Shows all individual products in each batch
- **QR Code Support**: View, download, and print QR codes for individual products
- **Batch Information**: Comprehensive batch details including storage conditions, manufacture dates, etc.

## Configuration

### Environment Variables Required
Add these to your `.env` file:
```
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_VERIFIED_EMAIL=your_verified_email@domain.com
```

### SendGrid Setup
1. Create a SendGrid account at https://sendgrid.com
2. Verify your sender email address
3. Create an API key with Mail Send permissions
4. Add the API key to your environment variables

## API Endpoints

### Test Email Endpoint
```
POST /api/email/send-test-email
```

**Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Test Subject",
  "text": "Test message",
  "type": "custom" // or "issue_report" or "receipt_confirmation"
}
```

### Email Templates Endpoint
```
GET /api/email/email-templates
```
Returns available email templates and their required fields.

## Usage Examples

### Testing Email Functionality
```bash
# Test custom email
curl -X POST http://localhost:3000/api/email/send-test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "This is a test email",
    "type": "custom"
  }'

# Test issue report template
curl -X POST http://localhost:3000/api/email/send-test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "to": "distributor@example.com",
    "pharmacyName": "City Pharmacy",
    "batchId": "BATCH-001",
    "productName": "Aspirin 100mg",
    "text": "Products arrived damaged - packaging was torn",
    "type": "issue_report"
  }'
```

### Automatic Email Triggers

#### When Pharmacy Reports Issues
1. Pharmacy confirms receipt with damage reported
2. System automatically finds the distributor who sent the batch
3. Issue report email is sent to distributor's email address
4. Email includes pharmacy details, batch information, and issue description

#### When Pharmacy Confirms Receipt Successfully
1. Pharmacy confirms receipt without issues
2. System automatically sends confirmation email to distributor
3. Email includes delivery confirmation details

## Pharmacy Inventory Enhancements

### New Features
- **Expandable Batch View**: Click to expand and see detailed batch information
- **Product Listing**: View all individual products within each batch
- **QR Code Modal**: Click QR icon to view, download, or print product QR codes
- **Enhanced Filtering**: Better product organization and filtering options

### UI Improvements
- Modern card-based design matching the distributor interface
- Smooth animations and transitions
- Mobile-responsive design
- Clear visual hierarchy

## Error Handling
- Email sending failures are logged but don't affect the main application flow
- Graceful degradation when email service is unavailable
- Detailed error logging for debugging

## Security
- Email sending requires proper authentication
- Rate limiting on email endpoints
- Input validation and sanitization
- No sensitive information in email logs

## Future Enhancements
- Email templates for manufacturer notifications
- Batch expiry reminder emails
- Weekly/monthly inventory reports via email
- Email preferences management for users
- Email delivery status tracking

## Troubleshooting

### Common Issues
1. **Email not sending**: Check SendGrid API key and verified sender email
2. **Template errors**: Ensure all required template fields are provided
3. **Authentication errors**: Verify JWT token is valid and user has proper permissions

### Debug Logging
Check server logs for email-related messages:
- `✅ Issue report email sent to distributor: email@example.com`
- `❌ Failed to send issue report email to distributor: error message`
- `⚠️ Distributor email not found for CompanyName`