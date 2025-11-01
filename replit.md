# BehaviorHub - School Behavior Management System

## Overview

BehaviorHub is a SaaS application for school behavior management, designed to help teachers and administrators track student behavior, generate AI-powered summaries, manage meetings, and create reports. The system provides a professional interface for recording behavioral incidents, analyzing trends, and maintaining communication records with students and parents.

**Core Functionality:**
- Student profile management with behavior tracking
- Behavior log creation and management (positive, neutral, concern, serious categories)
- Behavior log editing: Edit incident notes and strategies/follow-up measures
- Behavior log deletion with confirmation popup to prevent accidental removal
- Consistent date formatting (dd-MM-yyyy with time) throughout the application
- AI-generated behavior summaries using OpenAI's GPT-5 model
- Meeting notes and follow-up task management
- **Rich text follow-up management with Kanban board view**
- **Follow-up workflow tracking (To-Do, In-Progress, Done, Archived)**
- **HTML sanitization for rich text content to prevent XSS attacks**
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
- Authentication endpoints: `/api/auth/user`, `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`
- Organization endpoints: `/api/organizations`, `/api/organizations/:id/users`, `/api/organizations/:id/stats`
- Student endpoints: `/api/organizations/:orgId/students`
- AI assistant: `/api/assistant/chat`
- All organization-scoped routes protected with checkOrganizationAccess middleware
- Session-based authentication using Replit Auth

**Development Server:**
- Vite dev server integrated for HMR
- Custom logging middleware for API requests
- JSON body parsing with raw body preservation for webhooks

**Storage Layer:**
- Interface-based storage system (`IStorage`) in `server/storage.ts`
- Uses DatabaseStorage implementation with PostgreSQL
- Multi-tenant architecture with organization-scoped data access
- All operations enforce organization isolation via checkOrganizationAccess middleware

### Data Storage

**ORM:** Drizzle ORM configured for PostgreSQL
- Schema defined in `shared/schema.ts`
- Database client: Neon serverless PostgreSQL (`@neondatabase/serverless`)
- Migrations directory: `./migrations`
- WebSocket support for Neon using `ws` package

**Current Schema:**
- Users table: id, email, name, replit_user_id (for Replit Auth integration)
- Organizations table: id, name, code, email, phone, address, owner_id, created_at
- Organization_users table: user_id, organization_id, role, joined_at (for multi-tenant access control)
- Students table: id, organization_id, name, email, class, gender, created_at, updated_at
  - Unique constraint on (organization_id, email) via "unique_email_per_org" index
  - Email uniqueness enforced per organization (students in different orgs can share emails)
- Behavior_logs table: id, organization_id, student_id, category, notes, logged_at
- Meeting_notes table: id, organization_id, student_id, date, participants, summary, full_notes
- Follow_ups table: id, organization_id, student_id, title, description (rich text HTML), due_date (nullable), status (To-Do, In-Progress, Done, Archived), assignee (nullable), created_at, updated_at
  - **Description field stores sanitized HTML from rich text editor**
  - **Status field replaced priority field for workflow management**
  - **Assignee field tracks task ownership**
- Schema uses Drizzle-Zod for type-safe validation

**Database Configuration:**
- Connection pooling via Neon Pool
- Database URL expected in `DATABASE_URL` environment variable
- Schema push command: `npm run db:push`

**Multi-Tenant Implementation:**
- All organization-scoped data includes organization_id foreign key
- checkOrganizationAccess middleware enforces data isolation
- Dashboard and Students pages use React Query to fetch real database data
- Dashboard stats filter follow-ups by status (excludes Done and Archived from pending count)

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
- **Tiptap for rich text editing (follow-up descriptions)**
- **DOMPurify (isomorphic-dompurify) for HTML sanitization and XSS prevention**

**Development Tools:**
- Replit-specific plugins for development environment
- TypeScript for type safety across stack
- ESBuild for production builds
- PostCSS with Autoprefixer for CSS processing

**Session Management:**
- `connect-pg-simple` for PostgreSQL-backed sessions (configured but not actively used)
- Prepared for production session storage