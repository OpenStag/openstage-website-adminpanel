# Database Setup Guide

## Step 1: Initial Setup
1. Go to your Supabase project dashboard
2. Navigate to the SQL editor
3. Run the `design.sql` script to create all tables and policies

## Step 2: For Testing (Temporary)
If you're getting RLS errors, you can temporarily disable RLS for testing:

1. Run the `disable_rls_for_testing.sql` script
2. This will:
   - Disable RLS on all tables
   - Insert sample data for testing
   - Allow the admin panel to work without authentication

## Step 3: Test the Admin Panel
1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. You should see the connection test page first
4. If successful, switch back to the full admin panel

## Step 4: Production Setup (Important!)
After testing, for production use:

1. Run `enable_rls.sql` to re-enable security
2. Implement proper authentication (Supabase Auth)
3. Update the admin policies to allow authenticated admin users

## Troubleshooting

### Error: "RLS Policy Issue"
- RLS is enabled but no policies allow access
- Solution: Run the `disable_rls_for_testing.sql` for testing

### Error: "Table doesn't exist"
- The database schema hasn't been created
- Solution: Run the `design.sql` script first

### Error: "Missing environment variable"
- Environment variables not loaded
- Solution: Make sure `.env.local` has the correct Supabase credentials

### Empty response or connection timeout
- Wrong Supabase URL or key
- Solution: Double-check your Supabase project settings
