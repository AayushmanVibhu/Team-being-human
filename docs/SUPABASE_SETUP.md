# Supabase setup

## Authentication email template

Kinlii uses a six-digit email OTP. In the Supabase dashboard, open **Authentication → Email
Templates → Magic Link** and make sure the message contains `{{ .Token }}`. If the template uses
only `{{ .ConfirmationURL }}`, users will receive a link instead of the code requested by the app.

For production, also open **Authentication → URL Configuration** and set:

- Site URL: `https://kinlii.vercel.app`
- Redirect URL: `https://kinlii.vercel.app/**`

The application continues using its local prototype data until the database migration and environment variables are configured. This prevents an empty or partially configured database from breaking the deployed app.

## 1. Apply the schema

1. Open the Kinlii project in Supabase.
2. Select **SQL Editor** in the left sidebar.
3. Select **New query**.
4. Copy the complete contents of `supabase/migrations/202610130001_initial_kinlii_schema.sql`.
5. Paste it into the query editor and select **Run**.
6. Confirm that the query completes successfully.

The migration creates the production tables, indexes, triggers, event feed, join/leave functions, realtime publications, and Row Level Security policies. It adds the interest taxonomy but intentionally creates no fake users or events.

## 2. Configure authentication URLs

In Supabase, open **Authentication → URL Configuration** and set:

- Site URL: `https://kinlii.vercel.app`
- Redirect URL: `https://kinlii.vercel.app/**`
- Local redirect URL: `http://localhost:5173/**`

Keep email authentication enabled. The next integration pass will replace the prototype verification screen with Supabase email OTP and add an approved-university-domain check.

## 3. Get the public connection values

Open the project's **Connect** dialog or **Settings → API** and copy only:

- Project URL
- Publishable key

Do not copy the database password, secret key, or legacy service-role key into the frontend or chat.

## 4. Configure Vercel

Open **Vercel → Kinlii → Settings → Environment Variables** and add:

```text
VITE_SUPABASE_URL=<Project URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<Publishable key>
```

Enable each variable for Production, Preview, and Development. Redeploy only after the frontend has been switched from prototype mode to Supabase mode.

## 5. Configure local development

Copy `.env.example` to `.env.local`, replace the two placeholder values, and restart Vite. `.env.local` is ignored by Git.

## 6. Verify the migration

In Supabase's Table Editor, confirm these tables exist:

- `profiles`
- `interests`
- `profile_interests`
- `events`
- `event_members`
- `event_leave_records`
- `saved_events`
- `carpool_requests`
- `notifications`

Do not manually disable Row Level Security to work around an error. Fix the policy or authenticated request instead.
