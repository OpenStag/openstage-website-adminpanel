# OpenStage Website Admin Panel

This is a [Next.js](https://nextjs.org) project for managing design submissions in the OpenStage platform.

## Features

- View and manage design submissions
- Filter designs by status (pending, accepted, in_development, completed)
- Update design status with action buttons
- View user information and design details
- Responsive design with Tailwind CSS

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase project URL and anon key:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Database Setup:**
   - Run the SQL script in `database/design.sql` in your Supabase SQL editor
   - This creates the necessary tables and policies for design management

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) with your browser to see the admin panel.**

## Database Schema

The admin panel works with the following main tables:
- `designs` - Design submissions with status tracking
- `profiles` - User profiles linked to auth.users
- `design_status_history` - Audit trail of status changes
- `design_comments` - Comments on designs

## Status Flow

Designs follow this status progression:
1. **Pending** → Accept → **Accepted**
2. **Accepted** → Start Development → **In Development**
3. **In Development** → Mark Complete → **Completed**

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
