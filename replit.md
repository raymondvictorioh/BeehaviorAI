# BehaviorHub - School Behavior Management System

## Overview

BehaviorHub is a SaaS application for school behavior management, designed to help teachers and administrators track student behavior, generate AI-powered summaries, manage meetings, and create reports. The system provides a professional interface for recording behavioral incidents, analyzing trends, and maintaining communication records with students and parents.

**Core Functionality:**
- Student profile management with behavior tracking
- Behavior log creation and management (positive, neutral, concern, serious categories)
- AI-generated behavior summaries using OpenAI's GPT-5 model
- Meeting notes and follow-up task management
- Report generation for students and classes
- Real-time AI assistant for contextual help

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React with TypeScript, using Vite as the build tool

**UI Component Library:** shadcn/ui components built on Radix UI primitives
- Material Design-inspired approach with education-focused adaptations
- Consistent component library in `client/src/components/ui/`
- Custom business components in `client/src/components/`
- Design system prioritizes clarity, scannable information, and action-oriented layouts

**Styling:**
- Tailwind CSS for utility-first styling
- Custom design tokens defined in `client/src/index.css` with light/dark mode support
- Theme system with CSS variables for colors, spacing, and elevations
- Typography uses Inter font family from Google Fonts
- Spacing follows Tailwind units (2, 4, 6, 8) for consistent layouts

**State Management:**
- React Query (@tanstack/react-query) for server state management
- Local React state for UI interactions
- Custom queryClient configuration in `client/src/lib/queryClient.ts`

**Routing:** wouter for lightweight client-side routing

**Key Pages:**
- Dashboard: Overview statistics and recent activity
- Students: Grid view of all students with search
- StudentProfile: Detailed view with tabs for logs, meetings, follow-ups
- Reports: Report generation interface
- Settings: School configuration

**Design Principles:**
- Information should be immediately scannable
- Primary actions prominently placed
- Minimize clicks to common tasks
- Professional aesthetic conveying trust and reliability

### Backend Architecture

**Framework:** Express.js with TypeScript

**API Structure:**
- RESTful endpoints registered in `server/routes.ts`
- Currently implements `/api/assistant/chat` for AI interactions
- Session-based architecture prepared (storage layer exists)

**Development Server:**
- Vite dev server integrated for HMR
- Custom logging middleware for API requests
- JSON body parsing with raw body preservation for webhooks

**Storage Layer:**
- Interface-based storage system (`IStorage`) in `server/storage.ts`
- Currently uses in-memory storage (`MemStorage`)
- Designed to be swapped with database implementation
- User model defined but not yet fully integrated

### Data Storage

**ORM:** Drizzle ORM configured for PostgreSQL
- Schema defined in `shared/schema.ts`
- Database client: Neon serverless PostgreSQL (`@neondatabase/serverless`)
- Migrations directory: `./migrations`
- WebSocket support for Neon using `ws` package

**Current Schema:**
- Users table with UUID primary keys, username, and password
- Schema uses Drizzle-Zod for type-safe validation

**Database Configuration:**
- Connection pooling via Neon Pool
- Database URL expected in `DATABASE_URL` environment variable
- Schema push command: `npm run db:push`

**Note:** The application currently has mock data in components but is set up to integrate with PostgreSQL database. The storage layer and database schema exist but need to be connected to replace the mock implementations.

### External Dependencies

**AI Service:**
- OpenAI API integration in `server/openai.ts`
- Uses GPT-5 model (as of August 2025)
- Requires `OPENAI_API_KEY` environment variable
- Provides contextual assistance based on current page
- Generates behavior summaries and answers user queries

**Database:**
- Neon serverless PostgreSQL (configured but may not be actively provisioned)
- Connection via `@neondatabase/serverless` package
- WebSocket support for real-time capabilities

**UI Component Dependencies:**
- Radix UI primitives for accessible components
- Lucide React for icons
- React Hook Form with Zod resolvers for form validation
- date-fns for date formatting
- cmdk for command palette functionality

**Development Tools:**
- Replit-specific plugins for development environment
- TypeScript for type safety across stack
- ESBuild for production builds
- PostCSS with Autoprefixer for CSS processing

**Session Management:**
- `connect-pg-simple` for PostgreSQL-backed sessions (configured but not actively used)
- Prepared for production session storage