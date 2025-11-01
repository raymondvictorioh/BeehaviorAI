# Running BehaviorHub Locally

This guide explains how to run the BehaviorHub school behavior management application on your local computer.

## System Requirements

### Required Software
- **Node.js** (version 18 or higher recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** database server

## Database Setup

You'll need a PostgreSQL database with:
- Connection URL format: `postgresql://username:password@host:port/database_name`
- A `sessions` table (created by the app for session storage)
- All application tables will be created automatically via Drizzle ORM

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables

```bash
# Database connection
DATABASE_URL=postgresql://username:password@localhost:5432/behaviorhub

# Session security (generate with: openssl rand -base64 32)
SESSION_SECRET=your-random-secret-string-here

# OpenAI API for AI features
OPENAI_API_KEY=your-openai-api-key-here

# OIDC Authentication
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-oidc-client-id
```

### Optional PostgreSQL Variables
```bash
PGHOST=localhost
PGPORT=5432
PGDATABASE=behaviorhub
PGUSER=your-username
PGPASSWORD=your-password
```

## Installation Steps

### 1. Clone or Copy the Project
```bash
# If using git
git clone <repository-url>
cd behaviorhub

# Or copy all files to your local directory
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Database Schema
```bash
npm run db:push
```

This will create all necessary tables:
- users
- organizations
- organization_users
- students
- behavior_logs
- meeting_notes
- follow_ups
- sessions

### 4. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### 5. Build for Production (Optional)
```bash
# Build the application
npm run build

# Run production server
npm start
```

## NPM Scripts Reference

- `npm run dev` - Start development server (runs both backend and frontend with hot reload)
- `npm run build` - Build for production (creates dist folder)
- `npm start` - Run production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes to the database

## Port Configuration

- **Default Port:** 5000
- Frontend is served by Vite dev server in development
- Backend API runs on Express
- Both frontend and backend run on the same port

## Authentication Setup

**Important:** The application currently uses Replit's OIDC authentication, which won't work directly on localhost without modifications.

### Option A: Configure Your Own OIDC Provider

1. Set up an OIDC-compatible authentication provider (Auth0, Okta, etc.)
2. Update environment variables:
   ```bash
   ISSUER_URL=https://your-oidc-provider.com
   REPL_ID=your-oauth-client-id
   ```

### Option B: Modify Authentication System

For local development, you may need to:
1. Modify `server/replitAuth.ts` to use local authentication
2. Implement email/password authentication
3. Remove or bypass OIDC dependencies

This is the most complex part of running locally, as the app is designed for Replit's authentication system.

## Key Dependencies

All dependencies are installed via `npm install`:

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- shadcn/ui components (Radix UI primitives)
- Tiptap (rich text editor)
- React Query (state management)
- Wouter (routing)

### Backend
- Express.js (server framework)
- Drizzle ORM (database)
- Passport with OIDC strategy (authentication)
- OpenAI SDK (AI features)

### Database
- PostgreSQL via Neon serverless driver
- Drizzle ORM for schema management

### Security
- DOMPurify for HTML sanitization
- Express session with PostgreSQL storage

## Project Structure

```
/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
│   └── index.html
├── server/              # Backend Express server
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   ├── replitAuth.ts    # Authentication logic
│   └── index.ts         # Server entry point
├── shared/              # Shared TypeScript types and schemas
│   └── schema.ts        # Database schema definitions
├── attached_assets/     # Static assets and images
├── migrations/          # Database migrations (auto-generated)
├── dist/               # Production build output (generated)
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── drizzle.config.ts   # Database configuration
└── tailwind.config.ts  # Tailwind CSS configuration
```

## Database Tables

The following tables will be created automatically:

- **users** - User accounts
- **organizations** - School organizations
- **organization_users** - User-organization relationships
- **students** - Student profiles
- **behavior_logs** - Behavioral incident records
- **meeting_notes** - Meeting documentation
- **follow_ups** - Follow-up tasks with rich text descriptions
- **sessions** - User session storage

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Check PostgreSQL user has proper permissions

### Port Already in Use
- Change the port in your server configuration
- Or stop any process using port 5000

### Authentication Errors
- Most likely due to Replit OIDC not working locally
- See "Authentication Setup" section above
- Consider implementing local authentication for development

### Build Errors
- Run `npm run check` to see TypeScript errors
- Ensure all dependencies are installed
- Delete `node_modules` and run `npm install` again

## Getting API Keys

### OpenAI API Key
1. Sign up at https://platform.openai.com
2. Navigate to API keys section
3. Create a new API key
4. Add to your `.env` file as `OPENAI_API_KEY`

### Session Secret
Generate a secure random string:
```bash
openssl rand -base64 32
```

## Summary

**Main Requirements:**
1. Node.js and npm installed
2. PostgreSQL database running
3. OpenAI API key
4. Environment variables configured
5. Authentication setup (most complex part)

**Quick Start:**
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env  # Create and edit .env

# Push database schema
npm run db:push

# Run development server
npm run dev
```

**Main Challenges:**
- Setting up PostgreSQL database
- Obtaining OpenAI API key
- Configuring authentication (Replit OIDC won't work locally without modifications)
- Setting all required environment variables

Once these are configured, the application should run smoothly on your local machine!
