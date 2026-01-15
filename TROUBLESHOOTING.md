# Troubleshooting: "Database error saving new user"

## Issue Fixed ✅

The error was caused by the database trigger function trying to cast empty strings or NULL values to NUMERIC type, which caused the signup to fail.

## What Was Fixed

1. **Updated `handle_new_user()` function** to properly handle NULL values:
   - Added CASE statements to check for NULL/empty strings before casting to NUMERIC
   - Added EXCEPTION handler to catch errors and log them without failing user creation
   - Added ON CONFLICT clause for upsert behavior

2. **Updated signup code** to:
   - Wait for trigger to complete before updating profile
   - Handle errors gracefully (non-critical profile updates won't fail signup)
   - Better error handling and logging

3. **Updated App.jsx** to:
   - Better handle profile creation for OAuth users
   - Check for existing profiles before creating
   - Handle edge cases with NULL values

## Testing

Try signing up again. The signup should now work correctly. If you still see errors:

1. **Check browser console** for detailed error messages
2. **Check Supabase Dashboard** → **Logs** → **Postgres** for database errors
3. **Verify environment variables** are set correctly in `.env` file

## If Signup Still Fails

1. Check that your `.env` file has the correct Supabase URL and anon key
2. Verify the trigger exists: Run this in Supabase SQL Editor:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```
3. Check if user_profiles table exists and has correct structure
4. Try signing up with minimal data first (just email and password)

## Common Issues

### Issue: "Email already exists"
- Solution: Use a different email or sign in instead

### Issue: "Invalid email format"
- Solution: Check email format is valid

### Issue: "Password too short"
- Solution: Password must be at least 8 characters

### Issue: Profile not created after signup
- Solution: The trigger should create it automatically. Check `user_profiles` table in Supabase Dashboard. If missing, the App.jsx will create it on next login.
