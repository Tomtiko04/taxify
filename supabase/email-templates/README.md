# Taxify Email Templates

This directory contains professionally designed email templates for Taxify's authentication emails.

## Templates

1. **confirm-signup.html** - Email confirmation template for new user signups
2. **reset-password.html** - Password reset email template

## How to Use

These templates are designed to be used with Supabase's email template system.

### Steps to Configure in Supabase:

1. Log in to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select the template you want to update:
   - **Confirm signup** → Copy content from `confirm-signup.html`
   - **Reset password** → Copy content from `reset-password.html`
4. Paste the HTML content into the template editor
5. Make sure to preserve the `{{ .ConfirmationURL }}` variable - this is replaced by Supabase with the actual confirmation/reset link
6. Save the template

### Template Variables

Both templates use the following Supabase template variable:
- `{{ .ConfirmationURL }}` - The confirmation/reset link URL

### Features

- ✅ Responsive design (mobile-friendly)
- ✅ Branded with Taxify colors (green/emerald gradient)
- ✅ Professional and clean layout
- ✅ Clear call-to-action buttons
- ✅ Security notes and helpful tips
- ✅ Alternative link fallback for email clients that don't support buttons
- ✅ Consistent branding with Taxify logo

### Customization

You can customize these templates by:
- Changing colors in the `<style>` section
- Modifying text content
- Adjusting padding/spacing values
- Adding or removing sections

### Testing

After updating templates in Supabase:
1. Test the signup flow to see the confirmation email
2. Test the password reset flow to see the reset email
3. Check email rendering in different email clients (Gmail, Outlook, Apple Mail, etc.)

## Notes

- These templates use inline CSS for maximum email client compatibility
- The templates are designed to work with most modern email clients
- Some older email clients may not support all CSS features (gradients, backdrop-filter)
- Always test in multiple email clients before deploying
