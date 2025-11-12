# Claude AI Agent Guidelines for BeehaviorAI

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Communication Guidelines](#communication-guidelines)
4. [Core Development Patterns](#core-development-patterns)
5. [Code Review Checklist](#code-review-checklist)
6. [Common Tasks](#common-tasks)
7. [Project-Specific Conventions](#project-specific-conventions)
8. [Resources](#resources)

---

## Project Overview

### What is BeehaviorAI?

BeehaviorAI is a SaaS application for school behavior management, designed to help teachers and administrators track student behavior, generate AI-powered summaries, manage meetings, and create reports. The system provides a professional interface for recording behavioral incidents, analyzing trends, and maintaining communication records with students and parents.

### User Preferences

**Preferred communication style:** Simple, everyday language.

### Core Functionality

- Student profile management with behavior tracking
- Behavior log creation and management (positive, neutral, concern, serious categories)
- Behavior log editing: Edit incident notes and strategies/follow-up measures
- Behavior log deletion with confirmation popup to prevent accidental removal
- Consistent date formatting (dd-MM-yyyy with time) throughout the application
- AI-generated behavior summaries using OpenAI's GPT-5 model
- Meeting notes with real-time audio transcription (Whisper API)
- AI-powered meeting summary generation using GPT-5
- Dynamic waveform visualization during audio recording
- Conditional Summary tab that appears after AI summary generation
- Follow-up task management with rich text descriptions
- Rich text follow-up management with Kanban board view
- Follow-up workflow tracking (To-Do, In-Progress, Done, Archived)
- HTML sanitization for rich text content to prevent XSS attacks
- Report generation for students and classes
- Real-time AI assistant for contextual help
- Student resources management with links
- **Academic logs system** for tracking student academic performance (NEW)

### Academic Logs System

**Purpose:** Track student academic performance across subjects with categorized assessments, providing a comprehensive view of academic progress alongside behavioral tracking.

**Components:**

1. **Subjects** - School courses/subjects with optional codes and descriptions
   - 10 default subjects auto-seeded on organization creation:
     - Mathematics (MATH), English (ENG), Science (SCI), History (HIST)
     - Geography (GEO), Physical Education (PE), Art (ART), Music (MUS)
     - Computer Science (CS), Foreign Language (LANG)
   - Organizations can add custom subjects
   - Subjects can be archived (hidden from dropdowns but preserved in logs)
   - Default subjects marked with `isDefault: true` flag

2. **Academic Log Categories** - Performance levels for assessments
   - 5 default categories auto-seeded on organization creation:
     - Excellent (green, display order 0)
     - Good (blue, display order 1)
     - Satisfactory (amber, display order 2)
     - Needs Improvement (orange, display order 3)
     - Concern (red, display order 4)
   - Organizations can add custom categories with custom colors
   - Color-coded for visual distinction
   - Display order controls sorting in dropdowns

3. **Academic Logs** - Individual assessment records
   - Links students, subjects, and academic categories
   - Required fields: student, subject, category, assessment date, notes
   - Optional fields: grade (e.g., "A", "B+"), score (e.g., "85%", "90/100")
   - Tracks who logged the entry (`loggedBy`) and when (`loggedAt`)
   - Flexible grading system supports letter grades, percentages, or qualitative notes

**Database Schema:**

```typescript
// Subjects table
subjects {
  id: varchar (UUID)
  organizationId: varchar (FK → organizations, cascade delete)
  name: varchar(255) NOT NULL
  code: varchar(50) NULLABLE
  description: text NULLABLE
  isDefault: boolean DEFAULT false
  isArchived: boolean DEFAULT false
  createdAt: timestamp
  updatedAt: timestamp
}

// Academic Log Categories table
academic_log_categories {
  id: varchar (UUID)
  organizationId: varchar (FK → organizations, cascade delete)
  name: varchar(100) NOT NULL
  description: text NULLABLE
  color: varchar(50) NULLABLE
  displayOrder: integer DEFAULT 0
  createdAt: timestamp
  updatedAt: timestamp
}

// Academic Logs table
academic_logs {
  id: varchar (UUID)
  organizationId: varchar (FK → organizations)
  studentId: varchar (FK → students, cascade delete)
  subjectId: varchar (FK → subjects, restrict delete)
  categoryId: varchar (FK → academic_log_categories, restrict delete)
  assessmentDate: timestamp NOT NULL
  grade: varchar(20) NULLABLE
  score: varchar(50) NULLABLE
  notes: text NOT NULL
  loggedBy: varchar(255) NOT NULL
  loggedAt: timestamp
}
```

**Database Relationships:**
- **Student deletion** → Academic logs deleted (cascade) - removes all student data
- **Subject deletion** → Prevented if linked to academic logs (restrict) - maintains data integrity
- **Category deletion** → Prevented if linked to academic logs (restrict) - maintains data integrity

**API Endpoints:**

*Subjects:*
- `GET /api/organizations/:orgId/subjects` - Fetch all subjects
- `POST /api/organizations/:orgId/subjects` - Create subject
- `PATCH /api/organizations/:orgId/subjects/:id` - Update subject
- `DELETE /api/organizations/:orgId/subjects/:id` - Delete subject

*Academic Categories:*
- `GET /api/organizations/:orgId/academic-log-categories` - Fetch all categories
- `POST /api/organizations/:orgId/academic-log-categories` - Create category
- `PATCH /api/organizations/:orgId/academic-log-categories/:id` - Update category
- `DELETE /api/organizations/:orgId/academic-log-categories/:id` - Delete category

*Academic Logs:*
- `GET /api/organizations/:orgId/students/:studentId/academic-logs` - Fetch student's logs
- `POST /api/organizations/:orgId/students/:studentId/academic-logs` - Create log
- `PATCH /api/organizations/:orgId/academic-logs/:id` - Update log
- `DELETE /api/organizations/:orgId/academic-logs/:id` - Delete log

**Query Key Convention:**
```typescript
// Subjects
["/api/organizations", orgId, "subjects"]

// Academic Categories
["/api/organizations", orgId, "academic-log-categories"]

// Academic Logs (student-scoped)
["/api/organizations", orgId, "students", studentId, "academic-logs"]
```

**Default Seeding:**
Both default subjects and academic categories are automatically seeded when creating a new organization (`routes.ts` lines 273-275):
```typescript
await storage.seedDefaultSubjects(organization.id);
await storage.seedDefaultAcademicCategories(organization.id);
```

**Storage Layer:**
All storage methods follow the same pattern as behavior logs:
- Organization-scoped queries with multi-tenant isolation
- Drizzle ORM for type-safe database operations
- Proper error handling for foreign key constraints
- Sorting: subjects by isDefault then name; categories by displayOrder then name

**Frontend Implementation Status:**
- ✅ **Settings Page** - Subjects and Academic Categories management with full CRUD
  - "Subjects" tab: Create, edit, archive, delete subjects
  - "Academic" tab: Create, edit, delete academic categories
  - 100% optimistic updates for instant feedback
- ⏳ **StudentProfile Page** - Academic Logs tab (UI not yet built)
  - Will display student's academic logs
  - Create/edit/delete academic logs
  - Similar interface to behavior logs tab

**Security:**
- All endpoints use `isAuthenticated` and `checkOrganizationAccess` middleware
- Zod schema validation on all API requests
- Organization-scoped data isolation
- Foreign key constraints prevent orphaned records

### Recent Changes

**November 13, 2025 - Backend Refactoring & Test Infrastructure:**
- **MAJOR**: Backend refactoring reducing boilerplate by 60-70%
- Comprehensive test infrastructure with 90 tests (100% passing)
- Centralized error handling middleware
- Async handler wrapper eliminating try-catch blocks
- Validation middleware for consistent Zod schema usage
- Route factory pattern reducing route definitions from 13-19 lines to 5 lines
- Test-driven development (TDD) approach for all new infrastructure
- 5 routes migrated as proof of concept (students, categories, tasks)
- Full documentation in CLAUDE.md with examples
- **Impact**: Faster development, consistent error handling, easier maintenance

**November 10, 2025 - Academic Logs System:**
- New academic tracking feature alongside behavior management
- 3 new database tables: subjects, academic_log_categories, academic_logs
- 15 new API endpoints with full CRUD operations
- 20+ new storage methods with organization-scoped queries
- Settings page updated with "Subjects" and "Academic" tabs
- Default seeding: 10 subjects + 5 academic categories on organization creation
- 100% optimistic updates following BeehaviorAI patterns
- Comprehensive API documentation in CLAUDE.md

**November 9, 2025 - Optimistic UI Implementation (100% Coverage):**
- All 20 mutations now implement optimistic updates
- Instant UI feedback across all features
- Comprehensive documentation (OPTIMISTIC_UI.md, CLAUDE.md)
- Student resources feature with full CRUD operations

**November 8, 2025 - Migration to Supabase Authentication:**
- Replaced Replit OIDC authentication with Supabase Auth
- Email/password authentication using Supabase backend
- Custom login and signup pages with modern UI
- Session-based authentication with PostgreSQL session storage
- Environment-specific Supabase projects (DEV/PROD)
- Email confirmation flow with resend functionality
- Security improvements: CSRF protection, session regeneration, Zod validation

### Tech Stack

- **Frontend:** React + TypeScript + Vite + TanStack Router + TanStack Query
- **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
- **Backend:** Express.js + Node.js
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Supabase Auth
- **AI Services:** OpenAI (GPT-5, Whisper API)
- **Deployment:** Replit/Cloud hosting

### Architecture Overview

- Multi-tenant SaaS with organization-scoped data
- RESTful API with organization-based routing
- Optimistic UI updates for all mutations (100% coverage)
- Form validation using react-hook-form + Zod schemas
- Real-time features with WebSocket support

---

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
- 100% optimistic update coverage for instant feedback

**Routing:** wouter for lightweight client-side routing

**Key Pages:**
- Dashboard: Overview statistics and recent activity
- Students: Grid view of all students with search
- StudentProfile: Detailed view with tabs for logs, meetings, follow-ups, resources
- Reports: Report generation interface
- Settings: School configuration (organization, categories, classes)
- Onboarding: One-time organization setup

**Design Principles:**
- Information should be immediately scannable
- Primary actions prominently placed
- Minimize clicks to common tasks
- Professional aesthetic conveying trust and reliability
- Instant feedback through optimistic updates

### Backend Architecture

**Framework:** Express.js with TypeScript

**API Structure:**
- RESTful endpoints registered in `server/routes.ts`
- Authentication endpoints: `/api/auth/user`, `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`
- Organization endpoints: `/api/organizations`, `/api/organizations/:id/users`, `/api/organizations/:id/stats`
- Student endpoints: `/api/organizations/:orgId/students`
- Resource endpoints: `/api/organizations/:orgId/students/:studentId/resources`
- AI assistant: `/api/assistant/chat`
- Audio transcription: POST `/api/transcribe` (Whisper API)
- Meeting summary generation: POST `/api/generate-meeting-summary` (GPT-5)
- All organization-scoped routes protected with checkOrganizationAccess middleware
- Session-based authentication using Supabase

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

- **Users table:** id, email, name, supabase_user_id
- **Organizations table:** id, name, code, email, phone, address, owner_id, created_at
- **Organization_users table:** user_id, organization_id, role, joined_at (for multi-tenant access control)
- **Students table:** id, organization_id, name, email, class_id, gender, created_at, updated_at
  - Unique constraint on (organization_id, email) via "unique_email_per_org" index
  - Email uniqueness enforced per organization (students in different orgs can share emails)
- **Behavior_log_categories table:** id, organization_id, name, description (nullable), color (nullable), display_order, created_at, updated_at
  - Organization-specific categories for classifying behavior logs
  - 4 default categories auto-seeded on organization creation: Positive (green), Neutral (blue), Concern (amber), Serious (red)
  - Available colors: green, blue, amber, red, purple, pink, orange, teal, indigo
- **Behavior_logs table:** id, organization_id, student_id, category_id (foreign key to behavior_log_categories), incident_date, notes, strategies (nullable), logged_by, logged_at
  - Uses categoryId foreign key instead of category string for flexible, organization-specific categories
- **Meeting_notes table:** id, organization_id, student_id, date, participants, summary, full_notes
- **Follow_ups table:** id, organization_id, student_id, title, description (rich text HTML), due_date (nullable), status (To-Do, In-Progress, Done, Archived), assignee (nullable), created_at, updated_at
  - Description field stores sanitized HTML from rich text editor
  - Status field replaced priority field for workflow management
  - Assignee field tracks task ownership
- **Classes table:** id, organization_id, name, grade_level (nullable), created_at, updated_at
- **Student_resources table:** id, organization_id, student_id, title, url, created_at
  - Stores links and resources for students
  - Cascade delete on student removal
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
- Uses Whisper API for real-time audio transcription
- Requires `OPENAI_API_KEY` environment variable
- Features:
  - Contextual AI assistant based on current page
  - Behavior summaries for students
  - Meeting summary generation from notes and transcripts
  - Real-time audio transcription in 3-second chunks
- Meeting Summary Generation:
  - Analyzes notes and transcripts using GPT-5
  - Generates structured summaries with key points, action items, and recommendations
  - Appears in conditional "Summary" tab after generation
  - User-friendly error messages when API key is invalid/missing

**Database:**
- Neon serverless PostgreSQL
- Connection via `@neondatabase/serverless` package
- WebSocket support for real-time capabilities

**UI Component Dependencies:**
- Radix UI primitives for accessible components
- Lucide React for icons
- React Hook Form with Zod resolvers for form validation
- date-fns for date formatting
- cmdk for command palette functionality
- Tiptap for rich text editing (follow-up descriptions)
- DOMPurify (isomorphic-dompurify) for HTML sanitization and XSS prevention

**Development Tools:**
- TypeScript for type safety across stack
- ESBuild for production builds
- PostCSS with Autoprefixer for CSS processing

**Session Management:**
- `connect-pg-simple` for PostgreSQL-backed sessions
- Prepared for production session storage

### Optimistic UI Implementation

**Pattern:** All mutations follow a standardized optimistic update pattern using TanStack Query (React Query) for instant user feedback.

**Documentation:** See [OPTIMISTIC_UI.md](./OPTIMISTIC_UI.md) for complete implementation guide.

**Current Coverage:**
- 20 out of 20 mutations (100%) implement optimistic updates
- All user-facing CRUD operations provide instant feedback
- Consistent pattern across all features

**Implementation Strategy:**
1. **onMutate**: Cancel queries, snapshot data, update cache optimistically, close dialogs
2. **onSuccess**: Replace temporary IDs with real server data
3. **onError**: Rollback to previous state, reopen dialogs for retry
4. **onSettled**: Invalidate queries for eventual consistency

**Key Benefits:**
- Immediate UI feedback (no loading spinners for successful operations)
- Automatic rollback on errors
- Consistent UX across all features
- Reduced perceived latency (instant vs 500ms-2s wait time)

**Implementation Details:**
- Temporary IDs: `temp-${Date.now()}`
- Query cancellation prevents race conditions
- Context-based rollback on errors
- Dialog closure in onMutate for better UX
- Settled invalidation ensures data consistency

**Query Key Convention:**
All queries follow organization-scoped pattern:
```typescript
["/api/organizations", orgId, "resource-type", optionalId]
```

**Examples in Codebase:**
- CREATE: `createBehaviorLog`, `createFollowUp`, `createResource` (StudentProfile.tsx)
- UPDATE: `updateBehaviorLog`, `updateFollowUp`, `updateStudent` (StudentProfile.tsx, AddStudentDialog.tsx)
- DELETE: `deleteBehaviorLog`, `deleteFollowUp`, `deleteResource` (StudentProfile.tsx)
- Multi-query: `updateStudent` updates both list and detail queries (AddStudentDialog.tsx)

---

## Communication Guidelines

### Tone & Style
- Use simple, everyday language
- Avoid unnecessary technical jargon
- Focus on clarity and actionability
- Be concise and direct
- Provide specific examples when explaining concepts

### User Interaction
- Ask clarifying questions when requirements are ambiguous
- Suggest improvements or alternatives when appropriate
- Explain trade-offs when multiple approaches exist
- Anticipate edge cases and potential issues

---

## Core Development Patterns

### 1. Optimistic UI Updates (CRITICAL)

**ALL user-facing mutations MUST implement optimistic updates following the pattern in OPTIMISTIC_UI.md**

#### Required Elements
Every mutation must have these 5 handlers:

1. **mutationFn** - The actual API call
2. **onMutate** - Optimistic update (cancel queries, snapshot, update cache, close dialogs)
3. **onSuccess** - Replace temp IDs with real server data
4. **onError** - Rollback to previous state + reopen dialogs
5. **onSettled** - Invalidate queries for consistency

#### Quick Reference
```typescript
const mutation = useMutation({
  mutationFn: async (data) => { /* API call */ },
  onMutate: async (data) => {
    await queryClient.cancelQueries({ queryKey: [...] });
    const previous = queryClient.getQueryData([...]);
    // Update cache optimistically
    setIsDialogOpen(false);
    return { previous, tempId };
  },
  onSuccess: (serverData, _vars, context) => {
    // Replace temp with real data
  },
  onError: (error, _vars, context) => {
    queryClient.setQueryData([...], context.previous);
    setIsDialogOpen(true);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: [...] });
  },
});
```

### 2. Backend Route Patterns (NEW - November 2025)

**BeehaviorAI now uses a standardized route factory pattern that reduces boilerplate by 60-70%.**

#### Centralized Middleware

All routes benefit from three core middleware components:

1. **Error Handler Middleware** (`server/middleware/errorHandler.ts`)
   - Handles Zod validation errors → 400 status
   - Handles database constraints (23503, 23505, 23502) → 400 status
   - Handles "not found" errors → 404 status
   - Handles generic errors → 500 status
   - Registered globally in `server/index.ts`

2. **Async Handler Wrapper** (`server/middleware/asyncHandler.ts`)
   - Wraps async route handlers
   - Automatically catches promise rejections
   - Forwards errors to error handler
   - **Note**: Not needed when using `createHandler` (which includes async handling)

3. **Validation Middleware** (`server/middleware/validate.ts`)
   - Validates request body against Zod schemas
   - Transforms data according to schema
   - Passes validation errors to error handler

#### Route Factory Pattern

Use `createHandler` from `server/utils/routeFactory.ts` for ALL new routes:

```typescript
import { createHandler } from "./utils/routeFactory";
import { isAuthenticated, checkOrganizationAccess } from "./supabaseAuth";

// Simple GET route (Before: 13 lines | After: 5 lines)
app.get(
  "/api/organizations/:orgId/students",
  isAuthenticated,
  checkOrganizationAccess,
  createHandler({
    storage: ({ orgId }) => storage.getStudents(orgId!),
  })
);

// GET route with nested params (Before: 13 lines | After: 5 lines)
app.get(
  "/api/organizations/:orgId/students/:studentId/resources",
  isAuthenticated,
  checkOrganizationAccess,
  createHandler({
    storage: ({ orgId, studentId }) => storage.getStudentResources(studentId!, orgId!),
  })
);

// POST route with validation and data injection (Before: 28 lines | After: 8 lines)
app.post(
  "/api/organizations/:orgId/students",
  isAuthenticated,
  checkOrganizationAccess,
  createHandler({
    storage: ({ data }) => storage.createStudent(data),
    schema: insertStudentSchema,
    dataInjection: (req) => ({ organizationId: req.params.orgId }),
  })
);

// DELETE route (Before: 13 lines | After: 5 lines)
app.delete(
  "/api/organizations/:orgId/resources/:id",
  isAuthenticated,
  checkOrganizationAccess,
  createHandler({
    storage: ({ orgId, id }) => storage.deleteStudentResource(id!, orgId!),
  })
);
```

**What `createHandler` does automatically:**
- Extracts params (orgId, id, studentId, userId)
- Injects data into request body (organizationId, etc.)
- Validates with Zod schema (if provided)
- Calls storage method
- Returns JSON response
- Forwards errors to error handler middleware

**When to use `!` (non-null assertion):**
TypeScript marks params as potentially undefined, but middleware ensures they exist. Use `orgId!` and `id!` when calling storage methods.

#### Testing Backend Routes

All new middleware and utilities have comprehensive test coverage:

```bash
npm test                    # Run all tests (90 tests)
npm test -- errorHandler    # Test error handler (21 tests)
npm test -- asyncHandler    # Test async wrapper (20 tests)
npm test -- validate        # Test validation (23 tests)
npm test -- routeFactory    # Test route factory (26 tests)
```

**Test locations:**
- `server/middleware/__tests__/errorHandler.test.ts`
- `server/middleware/__tests__/asyncHandler.test.ts`
- `server/middleware/__tests__/validate.test.ts`
- `server/utils/__tests__/routeFactory.test.ts`

### 3. Naming Conventions

#### Mutations
- CREATE: `create{ResourceName}` (e.g., `createBehaviorLog`, `createStudent`)
- UPDATE: `update{ResourceName}` (e.g., `updateStudent`, `updateCategory`)
- DELETE: `delete{ResourceName}` (e.g., `deleteResource`, `deleteFollowUp`)

#### Query Keys
Organization-scoped format:
```typescript
["/api/organizations", orgId, "resource-type", optionalId]

// Examples:
["/api/organizations", "123", "students"]
["/api/organizations", "123", "students", "456"]
["/api/organizations", "123", "students", "456", "resources"]
```

#### Temporary IDs
```typescript
const tempId = `temp-${Date.now()}`;
```

### 3. Form Management

#### Pattern
- Use `react-hook-form` for form state
- Use Zod schemas for validation (shared with backend)
- Validate on blur and submit
- Show inline error messages

```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { /* ... */ },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### 4. Error Handling

#### User-Facing Errors
- Always provide user-friendly messages
- Use toast notifications for feedback
- Provide specific, actionable guidance
- Reopen dialogs on error for easy retry

```typescript
// GOOD
toast({
  title: "Failed to save student",
  description: "Please check that all required fields are filled and try again.",
  variant: "destructive",
});

// BAD
toast({
  title: "Error",
  description: error.message, // Technical error message
  variant: "destructive",
});
```

#### Server Errors
- Log detailed errors to console for debugging
- Transform technical errors to user-friendly messages
- Preserve stack traces for troubleshooting

```typescript
onError: (error: Error) => {
  console.error("Student creation error:", error); // ✅ Detailed logging
  toast({
    title: "Failed to create student",
    description: "Please try again. If the problem persists, contact support.",
    variant: "destructive",
  });
}
```

### 5. Dialog/Modal Management

#### Pattern
```typescript
const [isDialogOpen, setIsDialogOpen] = useState(false);

// Close in onMutate (instant feedback)
onMutate: async (data) => {
  // ... optimistic update ...
  setIsDialogOpen(false); // ✅ Immediate close
  return { previous };
},

// Reopen in onError (easy retry)
onError: (error, _vars, context) => {
  // ... rollback ...
  setIsDialogOpen(true); // ✅ Reopen for retry
  toast({ title: "Error", variant: "destructive" });
}
```

### 6. TypeScript Best Practices

- Use shared schema types from `shared/schema.ts`
- Avoid `any` types - use proper typing
- Use type inference where possible
- Define interfaces for component props
- Use utility types (`Partial`, `Pick`, `Omit`) appropriately

```typescript
// GOOD
interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertStudent) => void;
  isPending: boolean;
}

// BAD
interface AddStudentDialogProps {
  open: any;
  onOpenChange: any;
  onSubmit: any;
  isPending: any;
}
```

---

## Code Review Checklist

When reviewing code or making suggestions, verify:

### Optimistic Updates
- [ ] All 5 handlers present (mutationFn, onMutate, onSuccess, onError, onSettled)
- [ ] Queries canceled in onMutate (prevents race conditions)
- [ ] Previous data snapshots saved for rollback
- [ ] Temp IDs used for CREATE operations
- [ ] Temp IDs replaced with real data in onSuccess
- [ ] Cache rolled back in onError
- [ ] Dialogs close in onMutate
- [ ] Dialogs reopen in onError
- [ ] Queries invalidated in onSettled

### Data Flow
- [ ] Query keys follow organization-scoped pattern
- [ ] Mutations update correct query caches
- [ ] Multi-query updates handle all affected queries
- [ ] Context properly typed and returned from onMutate

### User Experience
- [ ] Error messages are user-friendly and actionable
- [ ] Success feedback provided via toast
- [ ] Loading states shown appropriately
- [ ] Forms validate on blur and submit
- [ ] Dialogs can be closed and reopened

### Code Quality
- [ ] TypeScript types properly defined
- [ ] No `any` types used
- [ ] Shared schemas used from `shared/schema.ts`
- [ ] Consistent naming conventions followed
- [ ] Comments added for complex logic
- [ ] No console.log in production code (use console.error for errors)

### Security
- [ ] User input validated on client and server
- [ ] Organization access checked on server
- [ ] Authentication required for protected routes
- [ ] XSS prevention (React handles this by default)
- [ ] SQL injection prevented (Drizzle ORM handles this)

---

## Common Tasks

### Adding a New Mutation

1. **Define the mutation function**
   ```typescript
   mutationFn: async (data: DataType) => {
     const res = await apiRequest("POST", `/api/organizations/${orgId}/resources`, data);
     return await res.json();
   }
   ```

2. **Implement onMutate**
   - Cancel queries: `await queryClient.cancelQueries({ queryKey: [...] })`
   - Snapshot: `const previous = queryClient.getQueryData([...])`
   - Create temp ID (for CREATE): `const tempId = \`temp-${Date.now()}\``
   - Update cache: `queryClient.setQueryData([...], optimisticData)`
   - Close dialog: `setIsDialogOpen(false)`
   - Return context: `return { previous, tempId }`

3. **Implement onSuccess**
   - Replace temp with real data (for CREATE)
   - Show success toast

4. **Implement onError**
   - Rollback: `queryClient.setQueryData([...], context.previous)`
   - Reopen dialog: `setIsDialogOpen(true)`
   - Show error toast

5. **Implement onSettled**
   - Invalidate queries: `queryClient.invalidateQueries({ queryKey: [...] })`

6. **Test thoroughly**
   - Test success path
   - Test error path (simulate network error)
   - Test rapid consecutive operations
   - Test empty cache scenario

### Building a Complete Feature

**CRITICAL: Always follow this API-first workflow to prevent route configuration errors.**

#### Overview: API-First Development Workflow

For BeehaviorAI, **always follow this order**:
1. **Schema** (shared/schema.ts) → 2. **Storage** (server/storage.ts) → 3. **Routes** (server/routes.ts) → 4. **Frontend**

This ensures proper validation, security, and data handling before UI integration.

---

#### Phase 1: Database Schema (shared/schema.ts)

**What to do:**
```typescript
// 1. Define table schema with proper foreign keys
export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  studentId: varchar("student_id").notNull().references(() => students.id),
  title: varchar("title", { length: 255 }).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Create Zod validation schemas
export const insertResourceSchema = createInsertSchema(resources);
export const updateResourceSchema = insertResourceSchema.partial();

// 3. Export TypeScript types
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type UpdateResource = z.infer<typeof updateResourceSchema>;
```

**Checklist:**
- [ ] Table includes `organizationId` foreign key (multi-tenant requirement)
- [ ] Proper foreign key relationships defined with `.references()`
- [ ] Insert schema created with `createInsertSchema()`
- [ ] Update schema created with `.partial()` for PATCH operations
- [ ] TypeScript types exported for use in frontend/backend

---

#### Phase 2: Storage Layer (server/storage.ts)

**What to do:**
```typescript
// Add methods to IStorage interface first
interface IStorage {
  // CREATE
  createResource(data: InsertResource): Promise<Resource>;

  // READ (organization-scoped or student-scoped)
  getStudentResources(studentId: string, organizationId: string): Promise<Resource[]>;
  getAllResources(organizationId: string): Promise<Resource[]>;

  // UPDATE (if needed)
  updateResource(id: string, organizationId: string, data: Partial<Resource>): Promise<Resource>;

  // DELETE
  deleteResource(id: string, organizationId: string): Promise<void>;
}

// Then implement in DatabaseStorage class
class DatabaseStorage implements IStorage {
  async createResource(data: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources).values(data).returning();
    return resource;
  }

  async getStudentResources(studentId: string, organizationId: string): Promise<Resource[]> {
    return await db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.studentId, studentId),
          eq(resources.organizationId, organizationId) // CRITICAL: Always filter by org
        )
      )
      .orderBy(desc(resources.createdAt));
  }

  async deleteResource(id: string, organizationId: string): Promise<void> {
    await db
      .delete(resources)
      .where(
        and(
          eq(resources.id, id),
          eq(resources.organizationId, organizationId) // CRITICAL: Prevent cross-org access
        )
      );
  }
}
```

**Checklist:**
- [ ] Methods added to `IStorage` interface
- [ ] Methods implemented in `DatabaseStorage` class
- [ ] **ALL queries filter by `organizationId`** (multi-tenant isolation)
- [ ] Proper error handling for database constraints
- [ ] Methods use Drizzle ORM (not raw SQL)
- [ ] Appropriate sorting with `.orderBy()`

---

#### Phase 3: API Routes (server/routes.ts) - MOST CRITICAL

**Route Pattern Examples:**

```typescript
// Import schemas at the top of routes.ts
import { insertResourceSchema, updateResourceSchema } from "@shared/schema";

// ========================================
// GET - Fetch resources (list)
// ========================================
app.get(
  "/api/organizations/:orgId/students/:studentId/resources",
  isAuthenticated,              // ✅ ALWAYS include
  checkOrganizationAccess,      // ✅ ALWAYS include for org routes
  async (req: any, res) => {
    try {
      const { orgId, studentId } = req.params;
      const resources = await storage.getStudentResources(studentId, orgId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  }
);

// ========================================
// POST - Create new resource
// ========================================
app.post(
  "/api/organizations/:orgId/students/:studentId/resources",
  isAuthenticated,
  checkOrganizationAccess,
  async (req: any, res) => {
    try {
      const { orgId, studentId } = req.params;

      // Inject organization/student IDs into request body
      const resourceData = {
        ...req.body,
        organizationId: orgId,
        studentId,
      };

      // ✅ ALWAYS validate with Zod schema
      const validatedData = insertResourceSchema.parse(resourceData);

      const newResource = await storage.createResource(validatedData);
      res.json(newResource);
    } catch (error: any) {
      console.error("Error creating resource:", error);

      // Handle specific error types
      if (error.code === "23503") {
        // Foreign key violation
        res.status(400).json({ message: "Invalid organization or student ID" });
      } else if (error.name === "ZodError") {
        // Validation error
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create resource", error: error.message });
      }
    }
  }
);

// ========================================
// PATCH - Update resource
// ========================================
app.patch(
  "/api/organizations/:orgId/resources/:id",
  isAuthenticated,
  checkOrganizationAccess,
  async (req: any, res) => {
    try {
      const { orgId, id } = req.params;

      // ✅ Validate partial updates
      const validatedData = updateResourceSchema.parse(req.body);

      const updatedResource = await storage.updateResource(id, orgId, validatedData);
      res.json(updatedResource);
    } catch (error: any) {
      console.error("Error updating resource:", error);

      if (error.name === "ZodError") {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update resource" });
      }
    }
  }
);

// ========================================
// DELETE - Delete resource
// ========================================
app.delete(
  "/api/organizations/:orgId/resources/:id",
  isAuthenticated,
  checkOrganizationAccess,
  async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      await storage.deleteResource(id, orgId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ message: "Failed to delete resource" });
    }
  }
);
```

**CRITICAL Route Checklist (Verify EVERY item):**
- [ ] **URL Pattern**: Follows organization-scoped pattern `/api/organizations/:orgId/...`
- [ ] **Middleware**: `isAuthenticated` ALWAYS present as first middleware
- [ ] **Middleware**: `checkOrganizationAccess` present for all org-scoped routes
- [ ] **Params**: Extract `orgId` from `req.params` correctly
- [ ] **Validation**: Use Zod schema `.parse()` for POST/PATCH requests
- [ ] **Data Injection**: Add `organizationId` (and related IDs) to data before validation
- [ ] **Error Handling**: Wrapped in try-catch block
- [ ] **Error Codes**: Specific status codes (400 for validation, 500 for server errors)
- [ ] **Error Messages**: User-friendly messages (not raw database errors)
- [ ] **Success Response**: Return JSON with proper data structure
- [ ] **HTTP Verbs**: GET (read), POST (create), PATCH (update), DELETE (delete)

**Common Pitfalls to Avoid:**

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `app.post("/api/...", async (req, res) => ...)` | `app.post("/api/...", isAuthenticated, checkOrganizationAccess, async (req, res) => ...)` |
| `/api/resources` | `/api/organizations/:orgId/resources` |
| `await storage.create(req.body)` | `const data = insertSchema.parse(req.body); await storage.create(data)` |
| `res.status(500).json({ error })` | `res.status(500).json({ message: "Failed to create resource" })` |
| `res.send("OK")` | `res.json({ success: true })` or `res.json(resource)` |

---

#### Phase 4: Frontend Implementation

**Step 1: Create useQuery hook for fetching**
```typescript
const { data: resources = [], isLoading } = useQuery<Resource[]>({
  queryKey: ["/api/organizations", orgId, "students", studentId, "resources"],
  //         ↑ MUST match API route path structure exactly
  queryFn: async () => {
    const res = await fetch(`/api/organizations/${orgId}/students/${studentId}/resources`);
    if (!res.ok) throw new Error("Failed to fetch resources");
    return res.json();
  },
  enabled: !!orgId && !!studentId, // Only run when IDs are available
});
```

**Step 2: Create useMutation hooks (with optimistic updates)**

See "Adding a New Mutation" section above for the complete 5-handler pattern.

**Query Key Convention (CRITICAL):**
```typescript
// Query key MUST mirror the API route structure
["/api/organizations", orgId, "students", studentId, "resources"]
//     ↓                  ↓       ↓         ↓          ↓
// /api/organizations/:orgId/students/:studentId/resources
```

**Frontend Checklist:**
- [ ] Query key matches API route path structure **exactly**
- [ ] Mutation includes all 5 handlers (mutationFn, onMutate, onSuccess, onError, onSettled)
- [ ] Optimistic updates implemented (see OPTIMISTIC_UI.md)
- [ ] Error handling with user-friendly toast messages
- [ ] Loading states shown during operations
- [ ] Forms use react-hook-form with Zod validation

---

#### Complete Feature Verification Checklist

**Before marking feature as complete, verify:**

**Backend (routes.ts):**
- [ ] All CRUD routes defined (GET, POST, PATCH, DELETE as needed)
- [ ] Every route has `isAuthenticated` middleware
- [ ] Every org-scoped route has `checkOrganizationAccess` middleware
- [ ] POST/PATCH routes validate with Zod schema
- [ ] Organization ID injected into data objects
- [ ] Try-catch error handling on all routes
- [ ] User-friendly error messages (not stack traces)
- [ ] Proper HTTP status codes (200, 400, 403, 500)

**Storage (storage.ts):**
- [ ] Methods declared in IStorage interface
- [ ] Methods implemented in DatabaseStorage class
- [ ] All queries filter by organizationId
- [ ] Proper ordering/sorting applied

**Frontend:**
- [ ] Query key matches route structure
- [ ] All mutations have optimistic updates
- [ ] Error handling with toast notifications
- [ ] Loading states during operations
- [ ] Forms validate with Zod schemas

**Testing:**
- [ ] Test routes with API client (Postman/Thunder Client/curl)
- [ ] Verify authentication required (401 without auth)
- [ ] Verify organization access control (403 for wrong org)
- [ ] Test validation errors (400 with helpful messages)
- [ ] Test foreign key constraint errors
- [ ] Test all CRUD operations in UI
- [ ] Test optimistic updates (instant feedback)
- [ ] Test error rollback behavior

---

#### Quick Reference: Common Route Patterns

| Pattern | Example Route | Use Case |
|---------|--------------|----------|
| Org-wide list | `GET /api/organizations/:orgId/students` | Fetch all students in organization |
| Single resource | `GET /api/organizations/:orgId/students/:id` | Fetch one specific student |
| Create org-level | `POST /api/organizations/:orgId/students` | Create new student in organization |
| Create nested | `POST /api/organizations/:orgId/students/:studentId/resources` | Create resource for specific student |
| Update resource | `PATCH /api/organizations/:orgId/students/:id` | Update existing student |
| Delete resource | `DELETE /api/organizations/:orgId/students/:id` | Delete student |
| Nested list | `GET /api/organizations/:orgId/students/:studentId/resources` | Fetch all resources for a student |

---

#### Debugging: When Routes Go Wrong

**404 Error - Route not found**
- [ ] Check route is registered in `server/routes.ts`
- [ ] Verify URL pattern matches exactly (case-sensitive, check pluralization)
- [ ] Check HTTP method matches (GET vs POST vs PATCH vs DELETE)
- [ ] Ensure middleware order is correct (auth before handler)
- [ ] **Restart the server** after adding new routes

**403 Error - Forbidden**
- [ ] Verify `checkOrganizationAccess` middleware is present
- [ ] Check user belongs to the organization being accessed
- [ ] Verify `orgId` in request matches user's organization

**400 Error - Bad request**
- [ ] Check Zod schema validation requirements
- [ ] Verify all required fields are present in request body
- [ ] Check data types match schema expectations
- [ ] Look at error response for specific validation failures

**500 Error - Server error**
- [ ] Check server console logs for stack trace
- [ ] Verify storage method exists and is implemented
- [ ] Check database constraints (foreign keys, unique constraints)
- [ ] Verify environment variables are set (DATABASE_URL, etc.)
- [ ] Check for null/undefined values being passed to database

### Updating Existing Code Without Optimistic Updates

See "Migration Guide" in OPTIMISTIC_UI.md for step-by-step instructions.

---

## Testing Strategy

### Manual Testing
1. **Happy Path**
   - Verify immediate UI feedback
   - Confirm operation completes successfully
   - Check data persistence

2. **Error Path**
   - Simulate network errors
   - Verify rollback behavior
   - Check error messages are user-friendly
   - Confirm dialog reopens for retry

3. **Edge Cases**
   - Empty data states
   - Rapid consecutive operations
   - Network latency
   - Race conditions

### Debugging Tools
- React DevTools (inspect component state)
- TanStack Query DevTools (inspect query cache)
- Network tab (monitor API calls)
- Console logs (add temporarily for debugging)

---

## Project-Specific Conventions

### Organization Context
All data is scoped to organizations. Always:
- Check organization access on server
- Include `organizationId` in data
- Use organization-scoped query keys
- Filter data by organization

### Student-Centric Design
Most features revolve around students:
- Student profile is the main view
- Behavior logs, follow-ups, and resources are student-scoped
- Categories and classes are organization-wide

### Multi-Tenancy
- Each organization has isolated data
- Users can belong to multiple organizations
- All routes include organization ID
- Server middleware validates access

### Performance Best Practices

#### Query Optimization
- Use `staleTime` appropriately (default: 0)
- Use `cacheTime` to keep inactive data (default: 5 minutes)
- Prefetch related data when appropriate
- Use optimistic updates to hide latency

#### Bundle Size
- Import only what you need from libraries
- Use tree-shaking friendly imports
- Lazy load routes and components when appropriate
- Monitor bundle size during builds

#### Rendering
- Use React.memo for expensive components
- Avoid unnecessary re-renders
- Use proper key props in lists
- Minimize state updates

---

## Resources

### Documentation
- [OPTIMISTIC_UI.md](./OPTIMISTIC_UI.md) - Detailed optimistic UI pattern guide
- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [React Hook Form Docs](https://react-hook-form.com/)
- [shadcn/ui Docs](https://ui.shadcn.com/)

### Key Files
- `shared/schema.ts` - Database schema and types
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database operations
- `client/src/lib/queryClient.ts` - Query configuration
- `client/src/pages/StudentProfile.tsx` - Main feature examples

### Example Patterns
Reference these files for examples:
- **Optimistic CREATE**: StudentProfile.tsx (createBehaviorLog, createFollowUp, createResource)
- **Optimistic UPDATE**: StudentProfile.tsx (updateBehaviorLog, updateFollowUp)
- **Optimistic DELETE**: StudentProfile.tsx (deleteResource, deleteBehaviorLog)
- **Multi-query updates**: AddStudentDialog.tsx (updateStudent)
- **Form validation**: AddStudentDialog.tsx, AddResourceDialog.tsx

---

## When to Ask Questions

### Always Ask When:
- Requirements are ambiguous or unclear
- Multiple valid approaches exist
- User hasn't specified preferences (e.g., which UI library component)
- Implementation would significantly impact user experience
- Technical constraints might limit options
- Security or data privacy implications exist

### Don't Ask When:
- Pattern is clearly documented (follow established patterns)
- Implementation is straightforward
- Best practice is obvious
- Question would delay simple tasks unnecessarily

---

## Version History

- **v1.1** (2025-11-09): Combined CURSOR.md and CLAUDE.md
  - Merged system architecture and development guidelines
  - Added comprehensive project overview
  - Included complete schema documentation
  - Unified all development patterns and conventions

- **v1.0** (2025-11-09): Initial documentation
  - 100% optimistic UI coverage (20/20 mutations)
  - Standardized patterns established
  - Comprehensive guidelines documented

---

**Remember:** The key to excellent UX in BeehaviorAI is instant feedback through optimistic updates. Every mutation should make the user feel like the app responds immediately, even when network requests are slow.
