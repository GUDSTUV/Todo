import nodemailer from "nodemailer";

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Prepare SMTP config from env with sensible defaults and sanitization
  const host = (process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const port = Number.parseInt(process.env.EMAIL_PORT || "587", 10);
  const user = (process.env.EMAIL_USERNAME || "").trim();
  // Google shows app passwords with spaces for readability; remove any whitespace just in case
  const pass = (process.env.EMAIL_PASSWORD || "").replace(/\s+/g, "");

  // Create primary transporter from env
  const primaryTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 uses SSL, 587/25 start as insecure and upgrade via STARTTLS
    auth: user && pass ? { user, pass } : undefined,
  });

  // We'll use this variable to send emails (might switch to Ethereal in non-prod)
  let transporter = primaryTransporter;

  // Verify SMTP connection for clearer error messages; if it fails in non-prod, try Ethereal fallback
  try {
    await primaryTransporter.verify();
  } catch (err) {
    console.error(
      "[sendEmail] SMTP verification failed:",
      (err as any)?.message || err
    );
    if ((process.env.NODE_ENV || "development") !== "production") {
      // Fallback to a test account so development can proceed
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.warn(
        "[sendEmail] Using Ethereal test SMTP account for development."
      );
    } else {
      throw new Error(
        "Email service is not configured correctly. Please check EMAIL_* settings."
      );
    }
  }

  // Define email options
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || "Todo App"} <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  // Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    // If using Ethereal (for dev), output preview URL in development only
    if (process.env.NODE_ENV === "development") {
      const preview = (nodemailer as any).getTestMessageUrl?.(info);
      if (preview) {
        console.log("[sendEmail] Preview URL:", preview);
      }
    }
  } catch (err) {
    console.error(
      "[sendEmail] Failed to send email:",
      (err as any)?.message || err
    );
    throw new Error(
      "Failed to send email via SMTP. Check credentials and provider settings."
    );
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
): Promise<void> => {
  const message = `
    You are receiving this email because you (or someone else) has requested the reset of a password.
    
    Please click on the following link, or paste it into your browser to complete the process:
    
    ${resetUrl}
    
    If you did not request this, please ignore this email and your password will remain unchanged.
    
    This link will expire in 10 minutes.
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4F46E5;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>You are receiving this email because you (or someone else) has requested the reset of your password.</p>
        <p>Please click on the button below to complete the process:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <div class="footer">
          <p>This link will expire in 10 minutes.</p>
          <p>© ${new Date().getFullYear()} Todo App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    email,
    subject: "Password Reset Request",
    message,
    html,
  });
};
