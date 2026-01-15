# Supabase Setup Guide for Taxify

## ✅ Database Schema Created

The following tables have been created in your Supabase project:

1. **user_profiles** - Stores user information (individual/company data)
2. **saved_calculations** - Stores saved tax calculations

Both tables have Row Level Security (RLS) enabled with policies that ensure users can only access their own data.

## 🔐 Setting Up Google OAuth

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   ```
   https://vtvmywthgujxhdncdknd.supabase.co/auth/v1/callback
   ```
7. Copy your **Client ID** and **Client Secret**

### Step 2: Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/vtvmywthgujxhdncdknd
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click to enable it
4. Enter your Google OAuth credentials:
   - **Client ID (for Google OAuth)**: Paste your Google Client ID
   - **Client Secret (for Google OAuth)**: Paste your Google Client Secret
5. Click **Save**

### Step 3: Configure Redirect URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add your site URL (for production):
   ```
   http://localhost:5173 (for development)
   https://yourdomain.com (for production)
   ```
3. Add redirect URLs:
   ```
   http://localhost:5173/**
   https://yourdomain.com/**
   ```

## 🔑 Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://vtvmywthgujxhdncdknd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

To get your anon key:
1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the **anon/public** key

## 📊 Database Tables Structure

### user_profiles
- `id` (UUID, Primary Key, references auth.users)
- `user_type` (TEXT: 'individual' or 'company')
- `full_name` (TEXT)
- `monthly_salary` (NUMERIC)
- `company_name` (TEXT)
- `business_type` (TEXT)
- `annual_turnover` (NUMERIC)
- `annual_income` (NUMERIC)
- `email` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### saved_calculations
- `id` (UUID, Primary Key)
- `user_id` (UUID, references auth.users)
- `calculation_type` (TEXT: 'personal' or 'business')
- `data` (JSONB - stores calculation results)
- `inputs` (JSONB - stores user inputs)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Automatic profile creation on signup
- Secure password requirements (min 8 characters)

## 🧪 Testing the Setup

1. **Test Email/Password Signup**:
   - Go to `/signup`
   - Fill out the form
   - Check Supabase Dashboard → **Authentication** → **Users** to see the new user
   - Check **Table Editor** → **user_profiles** to see the profile

2. **Test Google OAuth**:
   - Go to `/signup` or `/login`
   - Click "Sign up with Google" or "Sign in with Google"
   - Complete Google authentication
   - You should be redirected back to the app
   - Check Supabase Dashboard to verify the user and profile were created

3. **Test Saving Calculations**:
   - Sign in to your account
   - Use the calculator
   - Click "Save These Results for 2026"
   - Check **Table Editor** → **saved_calculations** to see the saved calculation

## 🐛 Troubleshooting

### Google OAuth not working?
- Verify redirect URI matches exactly: `https://vtvmywthgujxhdncdknd.supabase.co/auth/v1/callback`
- Check that Google OAuth is enabled in Supabase
- Verify Client ID and Secret are correct

### User profile not created?
- Check Supabase Dashboard → **Database** → **Functions** to see if the trigger is active
- Check **Table Editor** → **user_profiles** to see if data exists
- The trigger should automatically create profiles, but the code also handles this

### RLS policies blocking access?
- Verify you're signed in
- Check that the user_id matches auth.uid()
- Policies are set to allow users to only access their own data

## 📝 Next Steps

1. ✅ Database schema created
2. ✅ User profiles table with RLS
3. ✅ Saved calculations table with RLS
4. ✅ Automatic profile creation on signup
5. ⏳ Configure Google OAuth (follow steps above)
6. ⏳ Add your environment variables
7. ⏳ Test the authentication flow

Your Supabase project is ready! Just configure Google OAuth and add your environment variables.
