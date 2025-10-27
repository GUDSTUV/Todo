# Forget Password Implementation

This document explains how the forget password feature works in the Todu app.

## Overview

The forget password flow consists of 3 main steps:

1. User requests a password reset
2. User receives an email with a reset link
3. User sets a new password using the link

## Backend Implementation

### 1. User Model Updates (`server/src/models/User.ts`)

Added fields and methods to the User model:

```typescript
resetPasswordToken?: string;
resetPasswordExpire?: Date;
getResetPasswordToken(): string; // Method to generate and hash reset token
```

The `getResetPasswordToken()` method:

- Generates a random 32-byte token
- Hashes it using SHA256 for storage
- Sets expiration to 10 minutes
- Returns the unhashed token (to be sent in email)

### 2. Email Service (`server/src/utils/sendEmail.ts`)

Created utility functions for sending emails:

- `sendEmail()` - Generic email sender using nodemailer
- `sendPasswordResetEmail()` - Specialized function for password reset emails with styled HTML template

### 3. Auth Controllers (`server/src/controllers/authController.ts`)

Added two new controller functions:

#### `forgotPassword`

- Accepts user email
- Returns success message regardless of whether email exists (security best practice)
- Generates reset token and saves it to user document
- Sends email with reset link
- Link format: `${CLIENT_URL}/reset-password/${resetToken}`

#### `resetPassword`

- Accepts reset token (from URL) and new password
- Validates token hasn't expired
- Updates user password
- Clears reset token fields
- Logs user in automatically with new JWT

### 4. Routes (`server/src/routes/authRoutes.ts`)

Added routes:

```typescript
POST /api/auth/forgot-password
PUT /api/auth/reset-password/:resetToken
```

## Frontend Implementation

### 1. Forgot Password Page (`client/src/pages/auth/forgotPassword/ForgotPasswordPage.tsx`)

Features:

- Email input with validation
- Success state showing confirmation message
- Link back to login
- Option to try different email

### 2. Reset Password Page (`client/src/pages/auth/resetPassword/ResetPasswordPage.tsx`)

Features:

- New password and confirm password fields
- Password match validation
- Automatic login after successful reset
- Error handling for expired/invalid tokens

### 3. App Routes (`client/src/App.tsx`)

Added routes:

```typescript
/forgot-password
/reset-password/:resetToken
```

### 4. Login Page Update (`client/src/pages/auth/login/LoginPage.tsx`)

Added "Forgot password?" link that navigates to `/forgot-password`

## Email Configuration

### Gmail Setup (Recommended for Development)

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Create new app password
   - Copy the generated password

3. Add to `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=Todu App
```

### Other Email Providers

#### SendGrid

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USERNAME=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=your_verified_sender@example.com
```

#### Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USERNAME=your_mailgun_username
EMAIL_PASSWORD=your_mailgun_password
EMAIL_FROM=noreply@yourdomain.com
```

#### AWS SES

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USERNAME=your_aws_smtp_username
EMAIL_PASSWORD=your_aws_smtp_password
EMAIL_FROM=noreply@yourdomain.com
```

## Security Features

1. **Token Expiration**: Reset tokens expire after 10 minutes
2. **Hashed Tokens**: Tokens are hashed before storing in database
3. **No Email Disclosure**: System doesn't reveal if email exists
4. **OAuth Protection**: Prevents reset for Google OAuth-only accounts
5. **Single Use**: Token is cleared after successful password reset

## Testing

### Manual Testing Flow

1. Start the server with valid email credentials in `.env`
2. Navigate to `/login`
3. Click "Forgot password?"
4. Enter your email address
5. Check email for reset link
6. Click link or copy URL to browser
7. Enter new password and confirm
8. Verify automatic login to dashboard

### Test Cases

- ✅ Valid email receives reset link
- ✅ Invalid email shows same success message (no disclosure)
- ✅ Reset link works within 10 minutes
- ✅ Expired token shows error message
- ✅ Password validation works
- ✅ User is logged in after reset
- ✅ Old password no longer works
- ✅ OAuth-only users cannot reset password

## Error Handling

- **Email sending failure**: Token is cleared and error returned
- **Invalid token**: User-friendly error with link to request new one
- **Expired token**: Clear message asking to request new reset
- **Validation errors**: Field-specific error messages

## Dependencies

### Backend

```json
{
  "nodemailer": "^6.9.x",
  "@types/nodemailer": "^6.4.x"
}
```

### Frontend

- No additional dependencies (uses existing stack)

## Production Considerations

1. **Use Production Email Service**: Don't use Gmail in production
   - Consider SendGrid, Mailgun, AWS SES, or Postmark
2. **SSL/TLS**: Ensure secure email transmission
3. **Rate Limiting**: Add rate limiting to forgot-password endpoint
4. **Monitoring**: Log email sending success/failure
5. **Domain Authentication**: Set up SPF, DKIM, and DMARC records
6. **Custom Domain**: Use custom domain for sender email
7. **Email Templates**: Consider using email template service for better deliverability

## Troubleshooting

### Emails Not Sending

1. Check `.env` email credentials
2. Verify Gmail App Password is correct (not regular password)
3. Check server logs for email errors
4. Test SMTP connection manually
5. Check spam folder

### Token Issues

1. Verify token expiration time (10 minutes default)
2. Check database for `resetPasswordToken` and `resetPasswordExpire` fields
3. Ensure crypto module is working correctly
4. Verify URL encoding of token

### Frontend Issues

1. Check that routes are properly configured in App.tsx
2. Verify API endpoint URLs match backend
3. Check browser console for errors
4. Test with network tab open to see API responses

## Future Enhancements

- [ ] Add rate limiting (max 3 attempts per hour)
- [ ] Email template customization in admin panel
- [ ] SMS-based password reset option
- [ ] Password reset audit log
- [ ] Multi-language email templates
- [ ] Email queuing for high volume
- [ ] Custom token expiration settings
