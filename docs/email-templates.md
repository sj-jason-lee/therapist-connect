# Supabase Email Templates

Go to **Supabase Dashboard → Authentication → Email Templates** and update each template.

## Tips to Avoid Spam Filters

1. **Set up a custom SMTP** (recommended): Go to **Project Settings → Auth → SMTP Settings**
   - Use services like SendGrid, Mailgun, Postmark, or Resend
   - This significantly improves deliverability

2. **Add SPF, DKIM, and DMARC records** to your domain's DNS

3. **Use a custom sender email** on your domain (e.g., `noreply@therapistconnect.ca`)

---

## Confirm Signup Email

**Subject:** Welcome to TherapistConnect - Verify Your Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                TherapistConnect
              </h1>
              <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">
                Connecting Athletic Therapists with Events
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px; background-color: #ffffff;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">
                Welcome! Let's get started
              </h2>
              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
                Thanks for signing up for TherapistConnect. To complete your registration and start using your account, please verify your email address.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px; line-height: 22px;">
                This link will expire in 24 hours. If you didn't create an account with TherapistConnect, you can safely ignore this email.
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

              <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 14px;">
                TherapistConnect Inc.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © 2024 TherapistConnect. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Magic Link Email

**Subject:** Your TherapistConnect Login Link

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Link</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                TherapistConnect
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px; background-color: #ffffff;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">
                Your login link
              </h2>
              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
                Click the button below to securely sign in to your TherapistConnect account. This link will expire in 1 hour.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Sign In to TherapistConnect
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px; line-height: 22px;">
                If you didn't request this login link, you can safely ignore this email. Someone might have entered your email address by mistake.
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

              <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 14px;">
                TherapistConnect Inc.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © 2024 TherapistConnect. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Reset Password Email

**Subject:** Reset Your TherapistConnect Password

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                TherapistConnect
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px; background-color: #ffffff;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">
                Reset your password
              </h2>
              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
                We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="padding: 16px; background-color: #fef3c7; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 22px;">
                  <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email or contact our support team if you're concerned about your account security.
                </p>
              </div>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

              <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 14px;">
                TherapistConnect Inc.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © 2024 TherapistConnect. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Invite User Email

**Subject:** You've Been Invited to TherapistConnect

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                TherapistConnect
              </h1>
              <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">
                Connecting Athletic Therapists with Events
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px; background-color: #ffffff;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">
                You're invited!
              </h2>
              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
                You've been invited to join TherapistConnect, the platform connecting certified athletic therapists with sports events across Canada.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px; line-height: 22px;">
                This invitation link will expire in 7 days.
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

              <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 14px;">
                TherapistConnect Inc.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © 2024 TherapistConnect. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Change Email Address Email

**Subject:** Confirm Your New Email Address - TherapistConnect

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                TherapistConnect
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px; background-color: #ffffff;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">
                Confirm your new email
              </h2>
              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
                You requested to change your email address. Click the button below to confirm this change.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Confirm Email Change
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px; line-height: 22px;">
                If you didn't request this change, please contact our support team immediately.
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

              <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 14px;">
                TherapistConnect Inc.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © 2024 TherapistConnect. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Recommended SMTP Providers

To improve deliverability and avoid spam filters:

1. **Resend** (https://resend.com) - Developer-friendly, good free tier
2. **SendGrid** (https://sendgrid.com) - Industry standard
3. **Postmark** (https://postmarkapp.com) - Best deliverability
4. **Mailgun** (https://mailgun.com) - Good for transactional emails

Configure in **Supabase Dashboard → Project Settings → Auth → SMTP Settings**
