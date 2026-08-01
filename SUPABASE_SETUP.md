# Supabase Setup Guide

This guide will help you set up Supabase for authentication and backend functionality in your RedPulse application.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Node.js installed on your machine

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the project details:
   - **Name**: `redpulse-blood-management` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose a region closest to your users
5. Click "Create new project"
6. Wait for the project to be provisioned (this may take 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. Once your project is ready, go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL**: Found under "Project API keys"
   - **anon/public** key: Found under "Project API keys" (this is the public key)

## Step 3: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `supabase/schema.sql` from this repository
4. Paste it into the SQL Editor
5. Click "Run" to execute the schema

This will create:
- A `profiles` table to store user information
- Triggers to automatically create profiles when users sign up
- Row Level Security (RLS) policies for data protection
- Indexes for performance optimization

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="http://localhost:3000"
```

Replace the placeholder values with your actual Supabase credentials.

## Step 5: Install Dependencies

Since we've already added `@supabase/supabase-js` to `package.json`, run:

```bash
npm install
```

If you're on Windows and encounter script execution errors, you may need to:

1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Then run `npm install` again

## Step 6: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`

3. Test the authentication flow:
   - Click "Register" and create a new account
   - Try signing in with your credentials
   - Verify that you can access the dashboard

## Database Schema Overview

### Profiles Table
The `profiles` table contains the following fields:

- `id`: UUID (links to Supabase auth)
- `email`: User's email address
- `role`: User role ('admin', 'hospital', 'donor', 'patient')
- `full_name`: User's full name
- `phone`: Phone number (optional)
- `blood_type`: Blood type (optional, for donors/patients)
- `location`: Location (optional)
- `created_at`: Timestamp of profile creation
- `updated_at`: Timestamp of last update

### Emergency Requests Table
The `emergency_requests` table tracks blood emergency requests:

- `id`: UUID (primary key)
- `blood_type`: Required blood type
- `units_needed`: Number of units required
- `hospital_name`: Name of requesting hospital
- `hospital_location`: Hospital location
- `urgency`: Urgency level ('critical', 'urgent', 'standard')
- `patient_name`: Patient name (optional)
- `surgery_type`: Type of surgery/procedure (optional)
- `required_by`: Deadline for blood requirement (optional)
- `requesting_user_id`: UUID of user who created the request
- `status`: Request status ('open', 'matching', 'fulfilled', 'cancelled')
- `matched_donor_ids`: Array of matched donor UUIDs
- `ai_analysis`: JSONB object containing AI analysis results
- `notes`: Additional notes
- `created_at`: Timestamp of request creation
- `updated_at`: Timestamp of last update

### Donor Availability Table
The `donor_availability` table tracks donor availability and preferences:

- `id`: UUID (primary key)
- `donor_id`: UUID reference to profiles table
- `is_available`: Whether donor is currently available
- `current_location`: Donor's current location
- `last_known_location`: Last known location
- `can_travel_distance_km`: Maximum travel distance in km
- `response_time_minutes`: Expected response time in minutes
- `preferred_donation_time`: Preferred donation time ('morning', 'afternoon', 'evening', 'any')
- `last_donation_date`: Date of last donation
- `next_eligible_date`: Date when donor is next eligible to donate
- `notes`: Additional notes
- `created_at`: Timestamp of record creation
- `updated_at`: Timestamp of last update

### Emergency Responses Table
The `emergency_responses` table tracks donor responses to emergency requests:

- `id`: UUID (primary key)
- `emergency_request_id`: UUID reference to emergency_requests table
- `donor_id`: UUID reference to profiles table
- `response_status`: Response status ('pending', 'accepted', 'declined', 'completed')
- `response_time_minutes`: Time taken to respond
- `estimated_arrival_minutes`: Estimated arrival time
- `actual_arrival_minutes`: Actual arrival time
- `notes`: Additional notes
- `created_at`: Timestamp of response creation
- `updated_at`: Timestamp of last update

## Security Features

- **Row Level Security (RLS)**: Users can only access their own profiles
- **Automatic Profile Creation**: Profiles are created automatically when users sign up
- **Password Hashing**: Supabase handles password hashing automatically
- **Session Management**: Built-in session handling with automatic token refresh

## Troubleshooting

### "Missing Supabase environment variables" error
- Ensure you've created `.env.local` with the correct variable names
- Make sure the variables start with `VITE_` for client-side access
- Restart your development server after adding environment variables

### "Profile not found" error after sign up
- Check that the SQL schema was executed successfully
- Verify the trigger `on_auth_user_created` exists in your database
- Check the Supabase logs for any errors

### CORS errors
- Go to your Supabase project settings
- Add your local development URL (`http://localhost:3000`) to allowed origins
- Add your production URL when deploying

### Authentication state not persisting
- Ensure cookies/localStorage are enabled in your browser
- Check that the Supabase auth configuration is correct
- Verify the session timeout settings in Supabase

## Emergency Features Setup

The application includes an AI-powered Emergency Assistant for critical blood request management. Here's how to set it up:

### Emergency Workflow

1. **Natural Language Processing**: The AI Emergency Assistant extracts critical information from natural language descriptions of emergencies
2. **Decision Guidance**: Provides step-by-step guidance for critical decisions during emergencies
3. **Donor Matching**: Real-time matching of available donors based on blood type, location, and availability
4. **Request Logging**: Automatically logs emergency requests to the database for tracking and compliance

### Setting Up Donor Availability

For donors to be matched in emergencies, they need to set their availability:

1. Navigate to the donor dashboard
2. Update availability status (available/unavailable)
3. Set current location and travel preferences
4. Specify preferred donation times
5. Update last donation date for eligibility tracking

### Emergency Request Process

1. Hospital staff or administrators describe the emergency in natural language
2. AI extracts key information: blood type, units needed, location, urgency
3. System provides step-by-step decision guidance
4. Available donors are matched and ranked by proximity and eligibility
5. Emergency request is logged to the database with AI analysis
6. Donors can be contacted directly through the system

### Security Considerations

Emergency features implement strict Row Level Security:
- Only requesting users can view their own emergency requests
- Donors can only view and update their own availability
- Hospitals can view donor availability for matching purposes
- All emergency actions are logged for audit and compliance

## Next Steps

After setting up Supabase, you can:

1. Add more tables for blood inventory, emergency requests, etc. ✅ (Already included)
2. Implement real-time features using Supabase Realtime
3. Add file storage for donor photos or documents
4. Set up database functions for complex queries
5. Configure email templates for password reset and confirmation
6. Integrate Google Maps API for accurate distance calculations
7. Add SMS notifications for emergency donor contact
8. Implement blood inventory tracking and management

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
