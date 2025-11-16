# BeehaviorAI API Documentation

## Complete API Endpoint Reference

This document provides comprehensive documentation for all 77 API endpoints in the BeehaviorAI application.

**Last Updated:** November 2025

---

## Table of Contents

1. [Authentication Endpoints](#1-authentication-endpoints) (5 endpoints)
2. [Organization Endpoints](#2-organization-endpoints) (4 endpoints)
3. [Student Endpoints](#3-student-endpoints) (4 endpoints)
4. [Behavior Log Endpoints](#4-behavior-log-endpoints) (6 endpoints)
5. [Behavior Log Category Endpoints](#5-behavior-log-category-endpoints) (4 endpoints)
6. [Academic Log Endpoints](#6-academic-log-endpoints) (6 endpoints)
7. [Subject Endpoints](#7-subject-endpoints) (4 endpoints)
8. [Academic Log Category Endpoints](#8-academic-log-category-endpoints) (4 endpoints)
9. [Meeting Notes Endpoints](#9-meeting-notes-endpoints) (2 endpoints)
10. [Task/Follow-up Endpoints](#10-taskfollow-up-endpoints) (5 endpoints)
11. [Class Endpoints](#11-class-endpoints) (5 endpoints)
12. [Student Resources Endpoints](#12-student-resources-endpoints) (3 endpoints)
13. [Lists Endpoints](#13-lists-endpoints) (5 endpoints)
14. [List Items Endpoints](#14-list-items-endpoints) (3 endpoints)
15. [List Sharing Endpoints](#15-list-sharing-endpoints) (3 endpoints)
16. [AI Assistant Endpoints](#16-ai-assistant-endpoints) (3 endpoints)
17. [Summary Statistics](#17-summary-statistics)

---

## 1. Authentication Endpoints

### 1.1 POST /api/auth/signup

**Purpose:** Create a new user account with Supabase authentication

**Authentication:** None (public)

**Request Body:**
```typescript
{
  email: string;           // Valid email address
  password: string;        // Minimum 6 characters
  firstName: string;       // Required
  lastName: string;        // Required
}
```

**Validation Schema:** `signupSchema` (inline Zod schema in routes.ts)

**Response (Success - 200):**
```typescript
{
  message: "Signup successful",
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }
}
```

**Response (Email Confirmation Required - 200):**
```typescript
{
  message: "Please check your email to confirm your account",
  requiresEmailConfirmation: true
}
```

**Response (Error - 400/500):**
```typescript
{
  message: string;  // Error description
}
```

**Storage Method:** `storage.upsertUser()`

**Notes:**
- Creates user in Supabase Auth
- Persists user to local database
- Regenerates session on successful signup
- May require email confirmation depending on Supabase settings

---

### 1.2 POST /api/auth/resend-confirmation

**Purpose:** Resend email confirmation link

**Authentication:** None (public)

**Request Body:**
```typescript
{
  email: string;  // Email address that needs confirmation
}
```

**Response (Success - 200):**
```typescript
{
  message: "Confirmation email sent successfully"
}
```

**Response (Error - 400/500):**
```typescript
{
  message: string;
}
```

**Notes:**
- Uses Supabase `resend()` API
- Type: 'signup'

---

### 1.3 POST /api/auth/login

**Purpose:** Authenticate user with email and password

**Authentication:** None (public)

**Request Body:**
```typescript
{
  email: string;       // Valid email
  password: string;    // Minimum 6 characters
}
```

**Validation Schema:** `loginSchema` (inline Zod schema)

**Response (Success - 200):**
```typescript
{
  message: "Login successful",
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

**Response (Error - 401/500):**
```typescript
{
  message: string;
}
```

**Storage Method:** `storage.getUser()`, `storage.upsertUser()`

**Notes:**
- Uses Supabase `signInWithPassword()`
- Regenerates session to prevent session fixation
- Stores `supabaseUserId` in session
- Defensively creates user if missing from local database

---

### 1.4 POST /api/auth/logout

**Purpose:** Sign out user and destroy session

**Authentication:** None (but typically called when authenticated)

**Request Body:** None

**Response (Success - 200):**
```typescript
{
  message: "Logout successful"
}
```

**Response (Error - 500):**
```typescript
{
  message: string;
}
```

**Notes:**
- Signs out from Supabase
- Destroys Express session
- Clears session cookie

---

### 1.5 GET /api/auth/user

**Purpose:** Get currently authenticated user with organizations

**Authentication:** Required (`isAuthenticated`)

**Response (Success - 200):**
```typescript
{
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  organizations: Array<{
    id: string;
    name: string;
    code: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
```

**Response (Error - 404/500):**
```typescript
{
  message: string;
}
```

**Storage Methods:** `storage.getUser()`, `storage.getUserOrganizations()`

---

## 2. Organization Endpoints

### 2.1 POST /api/organizations

**Purpose:** Create a new organization

**Authentication:** Required (`isAuthenticated`)

**Request Body:**
```typescript
{
  name: string;         // Required
  code?: string;        // Optional
  email?: string;       // Optional
  phone?: string;       // Optional
  address?: string;     // Optional
}
```

**Validation Schema:** `insertOrganizationSchema`

**Response (Success - 200):**
```typescript
{
  id: string;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to create organization"
}
```

**Storage Methods:**
- `storage.createOrganization()`
- `storage.addUserToOrganization()` (adds creator as owner)
- `storage.seedDefaultSubjects()` (seeds 10 default subjects)
- `storage.seedDefaultAcademicCategories()` (seeds 5 default categories)

**Notes:**
- Automatically adds creator as organization owner
- Seeds default subjects (MATH, ENG, SCI, HIST, GEO, PE, ART, MUS, CS, LANG)
- Seeds default academic categories (Excellent, Good, Satisfactory, Needs Improvement, Concern)

---

### 2.2 PATCH /api/organizations/:id

**Purpose:** Update organization details

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `id` - Organization ID

**Request Body (all fields optional):**
```typescript
{
  name?: string;
  code?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}
```

**Response (Success - 200):**
```typescript
{
  id: string;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 500):**
```typescript
{
  message: string;
}
```

**Storage Method:** `storage.updateOrganization()`

---

### 2.3 GET /api/organizations/:id/users

**Purpose:** Get all users in an organization

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `id` - Organization ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;        // "owner", "admin", "teacher"
  joinedAt: Date;
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch organization users"
}
```

**Storage Method:** `storage.getOrganizationUsers()`

---

### 2.4 GET /api/organizations/:id/stats

**Purpose:** Get dashboard statistics for an organization

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `id` - Organization ID

**Response (Success - 200):**
```typescript
{
  totalStudents: number;
  totalBehaviorLogs: number;
  totalMeetings: number;
  pendingFollowUps: number;  // Excludes "Done" and "Archived" status
  recentActivities: Array<Activity>;  // Type depends on storage implementation
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch dashboard stats"
}
```

**Storage Method:** `storage.getDashboardStats()`

---

## 3. Student Endpoints

### 3.1 GET /api/organizations/:orgId/students

**Purpose:** Get all students in an organization

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  classId: string | null;
  gender: string | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch students"
}
```

**Storage Method:** `storage.getStudents()`

---

### 3.2 GET /api/organizations/:orgId/students/:id

**Purpose:** Get a specific student by ID

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Student ID

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  classId: string | null;
  gender: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 404/500):**
```typescript
{
  message: "Student not found" | "Failed to fetch student"
}
```

**Storage Method:** `storage.getStudent()`

---

### 3.3 POST /api/organizations/:orgId/students

**Purpose:** Create a new student

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Request Body:**
```typescript
{
  name: string;         // Required
  email?: string;       // Optional (must be unique per organization)
  classId?: string;     // Optional foreign key to classes table
  gender?: string;      // Optional
}
```

**Validation Schema:** `insertStudentSchema` (implicitly via storage layer)

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  classId: string | null;
  gender: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "A student with email {email} already exists in this organization"
    | "Failed to create student"
}
```

**Storage Method:** `storage.createStudent()`

**Notes:**
- Email must be unique within organization (enforced by `unique_email_per_org` index)
- Database error code 23505 indicates duplicate email constraint violation

---

### 3.4 PATCH /api/organizations/:orgId/students/:id

**Purpose:** Update student details

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Student ID

**Request Body (all fields optional):**
```typescript
{
  name?: string;
  email?: string | null;
  classId?: string | null;
  gender?: string | null;
}
```

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  classId: string | null;
  gender: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 400/404/500):**
```typescript
{
  message: "Student not found"
    | "A student with email {email} already exists in this organization"
    | "Invalid class selected. The class may have been deleted or doesn't exist."
    | "Failed to update student"
}
```

**Storage Method:** `storage.updateStudent()`

**Error Codes:**
- `23503` - Foreign key constraint (invalid classId)
- `23505` - Unique constraint violation (duplicate email)

---

## 4. Behavior Log Endpoints

### 4.1 GET /api/organizations/:orgId/behavior-logs

**Purpose:** Get all behavior logs for an organization (organization-wide view)

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  studentId: string;
  categoryId: string;
  incidentDate: Date;
  notes: string;
  strategies: string | null;
  loggedBy: string;
  loggedAt: Date;
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch behavior logs"
}
```

**Storage Method:** `storage.getAllBehaviorLogs()`

---

### 4.2 POST /api/organizations/:orgId/behavior-logs

**Purpose:** Create a behavior log at organization level

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Request Body:**
```typescript
{
  studentId: string;       // Required foreign key
  categoryId: string;      // Required foreign key
  notes: string;           // Required
  incidentDate?: string;   // Optional ISO date (defaults to now)
  loggedBy?: string;       // Optional (defaults to "Unknown")
  strategies?: string;     // Optional
}
```

**Validation Schema:** `insertBehaviorLogSchema` (implicitly)

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  studentId: string;
  categoryId: string;
  incidentDate: Date;
  notes: string;
  strategies: string | null;
  loggedBy: string;
  loggedAt: Date;
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "Invalid student or category ID" | "Failed to create behavior log"
}
```

**Storage Method:** `storage.createBehaviorLog()`

**Error Codes:**
- `23503` - Foreign key constraint violation (invalid studentId or categoryId)

---

### 4.3 GET /api/organizations/:orgId/students/:studentId/behavior-logs

**Purpose:** Get behavior logs for a specific student

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `studentId` - Student ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  studentId: string;
  categoryId: string;
  incidentDate: Date;
  notes: string;
  strategies: string | null;
  loggedBy: string;
  loggedAt: Date;
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch behavior logs"
}
```

**Storage Method:** `storage.getBehaviorLogs()`

---

### 4.4 POST /api/organizations/:orgId/students/:studentId/behavior-logs

**Purpose:** Create a behavior log for a specific student

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `studentId` - Student ID

**Request Body:**
```typescript
{
  categoryId: string;      // Required foreign key
  notes: string;           // Required
  incidentDate?: string;   // Optional ISO date
  loggedBy?: string;       // Optional
  strategies?: string;     // Optional
}
```

**Response:** Same as 4.2

**Storage Method:** `storage.createBehaviorLog()`

---

### 4.5 PATCH /api/organizations/:orgId/behavior-logs/:id

**Purpose:** Update an existing behavior log

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Behavior log ID

**Request Body (all fields optional):**
```typescript
{
  categoryId?: string;
  incidentDate?: string;
  notes?: string;
  strategies?: string;
  loggedBy?: string;
}
```

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  studentId: string;
  categoryId: string;
  incidentDate: Date;
  notes: string;
  strategies: string | null;
  loggedBy: string;
  loggedAt: Date;
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to update behavior log"
}
```

**Storage Method:** `storage.updateBehaviorLog()`

---

### 4.6 DELETE /api/organizations/:orgId/behavior-logs/:id

**Purpose:** Delete a behavior log

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Behavior log ID

**Response (Success - 200):**
```typescript
{
  success: true
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to delete behavior log"
}
```

**Storage Method:** `storage.deleteBehaviorLog()`

---

## 5. Behavior Log Category Endpoints

### 5.1 GET /api/organizations/:orgId/behavior-log-categories

**Purpose:** Get all behavior log categories for an organization

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string | null;         // "green", "blue", "amber", "red", etc.
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}>
```

**Response (Error - 400/500):**
```typescript
{
  message: "Organization ID is required" | "Failed to fetch behavior log categories"
}
```

**Storage Method:** `storage.getBehaviorLogCategories()`

**Notes:**
- 4 default categories are seeded on organization creation:
  - Positive (green, displayOrder: 0)
  - Neutral (blue, displayOrder: 1)
  - Concern (amber, displayOrder: 2)
  - Serious (red, displayOrder: 3)

---

### 5.2 POST /api/organizations/:orgId/behavior-log-categories

**Purpose:** Create a new behavior log category

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Request Body:**
```typescript
{
  name: string;           // Required
  description?: string;   // Optional
  color?: string;         // Optional (green, blue, amber, red, purple, pink, orange, teal, indigo)
  displayOrder?: number;  // Optional (defaults to 0)
}
```

**Validation Schema:** `insertBehaviorLogCategorySchema` (implicitly)

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to create behavior log category"
}
```

**Storage Method:** `storage.createBehaviorLogCategory()`

---

### 5.3 PATCH /api/organizations/:orgId/behavior-log-categories/:id

**Purpose:** Update a behavior log category

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Category ID

**Request Body (all fields optional):**
```typescript
{
  name?: string;
  description?: string | null;
  color?: string | null;
  displayOrder?: number;
}
```

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 404/500):**
```typescript
{
  message: "Category not found" | "Failed to update behavior log category"
}
```

**Storage Method:** `storage.updateBehaviorLogCategory()`

---

### 5.4 DELETE /api/organizations/:orgId/behavior-log-categories/:id

**Purpose:** Delete a behavior log category

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Category ID

**Response (Success - 200):**
```typescript
{
  success: true
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to delete behavior log category"
}
```

**Storage Method:** `storage.deleteBehaviorLogCategory()`

**Notes:**
- May fail if category is referenced by behavior logs (foreign key constraint with onDelete: "restrict")

---

## 6. Academic Log Endpoints

### 6.1 GET /api/organizations/:orgId/academic-logs

**Purpose:** Get all academic logs for an organization (organization-wide view)

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  studentId: string;
  subjectId: string;
  categoryId: string;
  assessmentDate: Date;
  grade: string | null;      // e.g., "A", "B+", "Pass"
  score: string | null;      // e.g., "85%", "90/100", "4.0"
  notes: string;
  loggedBy: string;
  loggedAt: Date;
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch academic logs"
}
```

**Storage Method:** `storage.getAllAcademicLogs()`

---

### 6.2 POST /api/organizations/:orgId/academic-logs

**Purpose:** Create an academic log at organization level

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Request Body:**
```typescript
{
  studentId: string;         // Required foreign key
  subjectId: string;         // Required foreign key
  categoryId: string;        // Required foreign key
  notes: string;             // Required
  assessmentDate?: string;   // Optional ISO date (defaults to now)
  grade?: string;            // Optional (e.g., "A", "B+")
  score?: string;            // Optional (e.g., "85%", "90/100")
}
```

**Validation Schema:** `insertAcademicLogSchema`

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  studentId: string;
  subjectId: string;
  categoryId: string;
  assessmentDate: Date;
  grade: string | null;
  score: string | null;
  notes: string;
  loggedBy: string;    // Automatically set to req.user.email
  loggedAt: Date;
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "Invalid organization, student, subject, or category ID"
    | "Validation error"
    | "Failed to create academic log"
}
```

**Storage Method:** `storage.createAcademicLog()`

**Error Codes:**
- `23503` - Foreign key constraint violation
- `ZodError` - Validation error

---

### 6.3 GET /api/organizations/:orgId/students/:studentId/academic-logs

**Purpose:** Get academic logs for a specific student

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `studentId` - Student ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  studentId: string;
  subjectId: string;
  categoryId: string;
  assessmentDate: Date;
  grade: string | null;
  score: string | null;
  notes: string;
  loggedBy: string;
  loggedAt: Date;
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch academic logs"
}
```

**Storage Method:** `storage.getAcademicLogs()`

---

### 6.4 POST /api/organizations/:orgId/students/:studentId/academic-logs

**Purpose:** Create an academic log for a specific student

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `studentId` - Student ID

**Request Body:**
```typescript
{
  subjectId: string;         // Required foreign key
  categoryId: string;        // Required foreign key
  notes: string;             // Required
  assessmentDate?: string;   // Optional ISO date
  grade?: string;            // Optional
  score?: string;            // Optional
}
```

**Validation Schema:** `insertAcademicLogSchema`

**Response:** Same as 6.2

**Storage Method:** `storage.createAcademicLog()`

---

### 6.5 PATCH /api/organizations/:orgId/academic-logs/:id

**Purpose:** Update an existing academic log

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Academic log ID

**Request Body (all fields optional):**
```typescript
{
  subjectId?: string;
  categoryId?: string;
  assessmentDate?: string;
  grade?: string | null;
  score?: string | null;
  notes?: string;
}
```

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  studentId: string;
  subjectId: string;
  categoryId: string;
  assessmentDate: Date;
  grade: string | null;
  score: string | null;
  notes: string;
  loggedBy: string;
  loggedAt: Date;
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to update academic log"
}
```

**Storage Method:** `storage.updateAcademicLog()`

**Notes:**
- `assessmentDate` string is automatically converted to Date object

---

### 6.6 DELETE /api/organizations/:orgId/academic-logs/:id

**Purpose:** Delete an academic log

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Academic log ID

**Response (Success - 200):**
```typescript
{
  success: true
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to delete academic log"
}
```

**Storage Method:** `storage.deleteAcademicLog()`

---

## 7. Subject Endpoints

### 7.1 GET /api/organizations/:orgId/subjects

**Purpose:** Get all subjects for an organization

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  description: string | null;
  isDefault: boolean;       // True for system-seeded subjects
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch subjects"
}
```

**Storage Method:** `storage.getSubjects()`

**Notes:**
- 10 default subjects are seeded on organization creation:
  - Mathematics (MATH), English (ENG), Science (SCI), History (HIST)
  - Geography (GEO), Physical Education (PE), Art (ART), Music (MUS)
  - Computer Science (CS), Foreign Language (LANG)

---

### 7.2 POST /api/organizations/:orgId/subjects

**Purpose:** Create a new subject

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Request Body:**
```typescript
{
  name: string;          // Required
  code?: string;         // Optional
  description?: string;  // Optional
  isDefault?: boolean;   // Optional (defaults to false)
  isArchived?: boolean;  // Optional (defaults to false)
}
```

**Validation Schema:** `insertSubjectSchema`

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  description: string | null;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "Validation error" | "Failed to create subject",
  errors?: Array<ZodError>  // If validation error
}
```

**Storage Method:** `storage.createSubject()`

---

### 7.3 PATCH /api/organizations/:orgId/subjects/:id

**Purpose:** Update a subject

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Subject ID

**Request Body (all fields optional):**
```typescript
{
  name?: string;
  code?: string | null;
  description?: string | null;
  isDefault?: boolean;
  isArchived?: boolean;
}
```

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  description: string | null;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to update subject"
}
```

**Storage Method:** `storage.updateSubject()`

---

### 7.4 DELETE /api/organizations/:orgId/subjects/:id

**Purpose:** Delete a subject

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Subject ID

**Response (Success - 200):**
```typescript
{
  success: true
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "Cannot delete subject that is in use by academic logs"
    | "Failed to delete subject"
}
```

**Storage Method:** `storage.deleteSubject()`

**Error Codes:**
- `23503` - Foreign key constraint (subject is referenced by academic logs with onDelete: "restrict")

---

## 8. Academic Log Category Endpoints

### 8.1 GET /api/organizations/:orgId/academic-log-categories

**Purpose:** Get all academic log categories for an organization

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string | null;      // "green", "blue", "amber", "orange", "red"
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}>
```

**Response (Error - 400/500):**
```typescript
{
  message: "Organization ID is required" | "Failed to fetch academic log categories"
}
```

**Storage Method:** `storage.getAcademicLogCategories()`

**Notes:**
- 5 default categories are seeded on organization creation:
  - Excellent (green, displayOrder: 0)
  - Good (blue, displayOrder: 1)
  - Satisfactory (amber, displayOrder: 2)
  - Needs Improvement (orange, displayOrder: 3)
  - Concern (red, displayOrder: 4)

---

### 8.2 POST /api/organizations/:orgId/academic-log-categories

**Purpose:** Create a new academic log category

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Request Body:**
```typescript
{
  name: string;           // Required
  description?: string;   // Optional
  color?: string;         // Optional
  displayOrder?: number;  // Optional (defaults to 0)
}
```

**Validation Schema:** `insertAcademicLogCategorySchema`

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "Validation error" | "Failed to create academic log category"
}
```

**Storage Method:** `storage.createAcademicLogCategory()`

---

### 8.3 PATCH /api/organizations/:orgId/academic-log-categories/:id

**Purpose:** Update an academic log category

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Category ID

**Request Body (all fields optional):**
```typescript
{
  name?: string;
  description?: string | null;
  color?: string | null;
  displayOrder?: number;
}
```

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to update academic log category"
}
```

**Storage Method:** `storage.updateAcademicLogCategory()`

---

### 8.4 DELETE /api/organizations/:orgId/academic-log-categories/:id

**Purpose:** Delete an academic log category

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Category ID

**Response (Success - 200):**
```typescript
{
  success: true
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "Cannot delete category that is in use by academic logs"
    | "Failed to delete academic log category"
}
```

**Storage Method:** `storage.deleteAcademicLogCategory()`

**Error Codes:**
- `23503` - Foreign key constraint (category is referenced by academic logs with onDelete: "restrict")

---

## 9. Meeting Notes Endpoints

### 9.1 GET /api/organizations/:orgId/students/:studentId/meeting-notes

**Purpose:** Get all meeting notes for a specific student

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `studentId` - Student ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  studentId: string;
  date: Date;
  participants: string[];
  summary: string;
  fullNotes: string | null;
  createdAt: Date;
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch meeting notes"
}
```

**Storage Method:** `storage.getMeetingNotes()`

---

### 9.2 POST /api/organizations/:orgId/students/:studentId/meeting-notes

**Purpose:** Create a new meeting note for a student

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `studentId` - Student ID

**Request Body:**
```typescript
{
  title?: string;           // Optional (used as summary)
  date?: string;            // Optional ISO date (defaults to now)
  participants?: string[];  // Optional (defaults to empty array)
  notes?: string;           // Optional
  transcript?: string;      // Optional (from Whisper API)
}
```

**Validation Schema:** `insertMeetingNoteSchema` (implicitly)

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  studentId: string;
  date: Date;
  participants: string[];
  summary: string;       // From title or defaults to "Meeting notes"
  fullNotes: string;     // Combines notes and transcript with separator
  createdAt: Date;
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to create meeting note"
}
```

**Storage Method:** `storage.createMeetingNote()`

**Notes:**
- `fullNotes` combines `notes` and `transcript` with separator: `--- Transcript ---`
- `summary` defaults to `title` or "Meeting notes" if title not provided

---

## 10. Task/Follow-up Endpoints

### 10.1 GET /api/organizations/:orgId/tasks

**Purpose:** Get all tasks for an organization with student data

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  studentId: string;
  title: string;
  description: string | null;  // Rich text HTML
  dueDate: Date | null;
  status: string;              // "To-Do", "In-Progress", "Done", "Archived"
  assignee: {                  // Transformed from string to object
    id: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  // Additional student data from join
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch tasks"
}
```

**Storage Method:** `storage.getAllTasksWithStudents()`

**Notes:**
- Returns tasks with joined student data
- `assignee` is transformed from string to object structure

---

### 10.2 GET /api/organizations/:orgId/students/:studentId/tasks

**Purpose:** Get tasks for a specific student

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `studentId` - Student ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  studentId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: string;
  assignee: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch student tasks"
}
```

**Storage Method:** `storage.getTasks()`

---

### 10.3 POST /api/organizations/:orgId/students/:studentId/tasks

**Purpose:** Create a new task for a student

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `studentId` - Student ID

**Request Body:**
```typescript
{
  title: string;           // Required
  description?: string;    // Optional rich text HTML (sanitized)
  dueDate?: string;        // Optional ISO date
  status?: string;         // Optional (defaults to "To-Do")
  assignee?: string;       // Optional user identifier
}
```

**Validation Schema:** `insertTaskSchema`

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  studentId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: string;
  assignee: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "Invalid organization or student ID"
    | "Validation error"
    | "Failed to create task",
  errors?: Array<ZodError>
}
```

**Storage Method:** `storage.createTask()`

**Error Codes:**
- `23503` - Foreign key constraint
- `ZodError` - Validation error

**Notes:**
- `dueDate` string is converted to Date object
- `description` stores sanitized HTML from rich text editor

---

### 10.4 PATCH /api/organizations/:orgId/tasks/:id

**Purpose:** Update a task

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Task ID

**Request Body (all fields optional):**
```typescript
{
  title?: string;          // Cannot be empty if provided
  description?: string | null;
  dueDate?: string | null;
  status?: string;
  assignee?: string | null;
}
```

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  studentId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: string;
  assignee: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "Title cannot be empty"
    | "No fields provided to update"
    | "Invalid organization or task ID"
    | "Validation error"
    | "Failed to update task"
}
```

**Storage Method:** `storage.updateTask()`

**Error Codes:**
- `23503` - Foreign key constraint
- `23502` - NOT NULL constraint violation
- `ZodError` - Validation error

**Notes:**
- Title cannot be set to empty/null
- `dueDate` string is converted to Date object
- Immutable fields (organizationId, studentId, id) are removed from update data

---

### 10.5 DELETE /api/organizations/:orgId/tasks/:id

**Purpose:** Delete a task

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Task ID

**Response (Success - 200):**
```typescript
{
  success: true
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to delete task"
}
```

**Storage Method:** `storage.deleteTask()`

---

## 11. Class Endpoints

### 11.1 GET /api/organizations/:orgId/classes

**Purpose:** Get all classes in an organization

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Query Parameters:**
- `includeArchived` - "true" to include archived classes (defaults to false)

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch classes"
}
```

**Storage Method:** `storage.getClasses()`

**Notes:**
- By default, excludes archived classes
- Use `?includeArchived=true` to include archived classes

---

### 11.2 GET /api/organizations/:orgId/classes/:id

**Purpose:** Get a specific class by ID

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Class ID

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 404/500):**
```typescript
{
  message: "Class not found" | "Failed to fetch class"
}
```

**Storage Method:** `storage.getClass()`

---

### 11.3 POST /api/organizations/:orgId/classes

**Purpose:** Create a new class

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Request Body:**
```typescript
{
  name: string;          // Required
  description?: string;  // Optional
  isArchived?: boolean;  // Optional (defaults to false)
}
```

**Validation Schema:** `insertClassSchema` (implicitly)

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to create class"
}
```

**Storage Method:** `storage.createClass()`

---

### 11.4 PATCH /api/organizations/:orgId/classes/:id

**Purpose:** Update a class

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Class ID

**Request Body (all fields optional):**
```typescript
{
  name?: string;
  description?: string | null;
  isArchived?: boolean;
}
```

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 404/500):**
```typescript
{
  message: "Class not found" | "Failed to update class"
}
```

**Storage Method:** `storage.updateClass()`

---

### 11.5 DELETE /api/organizations/:orgId/classes/:id

**Purpose:** Delete a class

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Class ID

**Response (Success - 200):**
```typescript
{
  success: true
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "Cannot delete class with assigned students" | "Failed to delete class"
}
```

**Storage Method:** `storage.deleteClass()`

**Notes:**
- Deletion fails if class has assigned students (business logic validation)

---

## 12. Student Resources Endpoints

### 12.1 GET /api/organizations/:orgId/students/:studentId/resources

**Purpose:** Get all resources for a specific student

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `studentId` - Student ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  studentId: string;
  title: string;
  url: string;
  createdAt: Date;
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch student resources"
}
```

**Storage Method:** `storage.getStudentResources()`

---

### 12.2 POST /api/organizations/:orgId/students/:studentId/resources

**Purpose:** Create a new resource for a student

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `studentId` - Student ID

**Request Body:**
```typescript
{
  title: string;  // Required
  url: string;    // Required
}
```

**Validation Schema:** `insertStudentResourceSchema`

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  studentId: string;
  title: string;
  url: string;
  createdAt: Date;
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "Invalid organization or student ID"
    | "Validation error"
    | "Failed to create student resource"
}
```

**Storage Method:** `storage.createStudentResource()`

**Error Codes:**
- `23503` - Foreign key constraint
- `ZodError` - Validation error

---

### 12.3 DELETE /api/organizations/:orgId/resources/:id

**Purpose:** Delete a student resource

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - Resource ID

**Response (Success - 200):**
```typescript
{
  success: true
}
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to delete student resource"
}
```

**Storage Method:** `storage.deleteStudentResource()`

**Notes:**
- Automatically deleted when student is deleted (onDelete: "cascade")

---

## 13. Lists Endpoints

### 13.1 GET /api/organizations/:orgId/lists

**Purpose:** Get all lists created by user or shared with user

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: string;           // "students", "behavior_logs", "academic_logs"
  createdBy: string;      // User ID
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: {       // Optional joined user data
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}>
```

**Response (Error - 500):**
```typescript
{
  message: "Failed to fetch lists"
}
```

**Storage Method:** `storage.getLists()`

**Notes:**
- Returns lists created by current user OR shared with current user
- Includes creator user data via join

---

### 13.2 POST /api/organizations/:orgId/lists

**Purpose:** Create a new list

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID

**Request Body:**
```typescript
{
  name: string;          // Required
  description?: string;  // Optional
  type: string;          // Required: "students", "behavior_logs", "academic_logs"
}
```

**Validation Schema:** `insertListSchema`

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: string;
  createdBy: string;  // Automatically set to current user ID
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "Validation error" | "Failed to create list"
}
```

**Storage Method:** `storage.createList()`

**Notes:**
- `createdBy` is automatically set to current user ID from session

---

### 13.3 GET /api/organizations/:orgId/lists/:id

**Purpose:** Get a specific list with access check

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - List ID

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}
```

**Response (Error - 404/500):**
```typescript
{
  message: "List not found or no access" | "Failed to fetch list"
}
```

**Storage Method:** `storage.getList()`

**Notes:**
- Access granted if user is creator OR list is shared with user

---

### 13.4 PATCH /api/organizations/:orgId/lists/:id

**Purpose:** Update a list

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - List ID

**Request Body (all fields optional):**
```typescript
{
  name?: string;
  description?: string | null;
  type?: string;
}
```

**Validation Schema:** `insertListSchema.partial()`

**Response (Success - 200):**
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response (Error - 400/403/500):**
```typescript
{
  message: "Only list creator can update"
    | "Validation error"
    | "Failed to update list"
}
```

**Storage Method:** `storage.updateList()`

**Notes:**
- Only the list creator can update (not shared users)

---

### 13.5 DELETE /api/organizations/:orgId/lists/:id

**Purpose:** Delete a list

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `id` - List ID

**Response (Success - 200):**
```typescript
{
  success: true
}
```

**Response (Error - 403/500):**
```typescript
{
  message: "Only list creator can delete" | "Failed to delete list"
}
```

**Storage Method:** `storage.deleteList()`

**Notes:**
- Only the list creator can delete (not shared users)
- Cascade deletes list items and shares (onDelete: "cascade")

---

## 14. List Items Endpoints

### 14.1 GET /api/organizations/:orgId/lists/:listId/items

**Purpose:** Get all items in a list

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `listId` - List ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  listId: string;
  // Polymorphic references (only one will be populated based on list.type)
  studentId: string | null;
  behaviorLogId: string | null;
  academicLogId: string | null;
  addedBy: string;       // User ID
  addedAt: Date;
  notes: string | null;
  addedByUser?: {        // Optional joined user data
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}>
```

**Response (Error - 404/500):**
```typescript
{
  message: "List not found or no access" | "Failed to fetch list items"
}
```

**Storage Method:** `storage.getListItems()`

**Notes:**
- Verifies user has access to list (creator or shared with)
- Returns items with joined user data

---

### 14.2 POST /api/organizations/:orgId/lists/:listId/items

**Purpose:** Add an item to a list

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `listId` - List ID

**Request Body (provide ONE of the ID fields based on list type):**
```typescript
{
  studentId?: string;      // For "students" lists
  behaviorLogId?: string;  // For "behavior_logs" lists
  academicLogId?: string;  // For "academic_logs" lists
  notes?: string;          // Optional notes about why item is in list
}
```

**Validation Schema:** `insertListItemSchema`

**Response (Success - 200):**
```typescript
{
  id: string;
  listId: string;
  studentId: string | null;
  behaviorLogId: string | null;
  academicLogId: string | null;
  addedBy: string;  // Automatically set to current user ID
  addedAt: Date;
  notes: string | null;
}
```

**Response (Error - 400/500):**
```typescript
{
  message: "This item is already in the list"
    | "Validation error"
    | "Failed to add item to list"
}
```

**Storage Method:** `storage.addListItem()`

**Error Codes:**
- `23505` - Unique constraint violation (duplicate item in list)
- `ZodError` - Validation error

**Notes:**
- Unique constraints prevent duplicate items:
  - `unique_list_student` (listId + studentId)
  - `unique_list_behavior_log` (listId + behaviorLogId)
  - `unique_list_academic_log` (listId + academicLogId)

---

### 14.3 DELETE /api/organizations/:orgId/lists/:listId/items/:id

**Purpose:** Remove an item from a list

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `listId` - List ID
- `id` - List item ID

**Response (Success - 200):**
```typescript
{
  success: true
}
```

**Response (Error - 404/500):**
```typescript
{
  message: "List not found or no access" | "Failed to remove item from list"
}
```

**Storage Method:** `storage.removeListItem()`

**Notes:**
- Verifies user has access to list before deletion

---

## 15. List Sharing Endpoints

### 15.1 GET /api/organizations/:orgId/lists/:listId/shares

**Purpose:** Get users a list is shared with

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID (not used but required for middleware)
- `listId` - List ID

**Response (Success - 200):**
```typescript
Array<{
  id: string;
  listId: string;
  sharedWithUserId: string;
  sharedBy: string;
  sharedAt: Date;
}>
```

**Response (Error - 403/500):**
```typescript
{
  message: "Only list creator can view shares" | "Failed to fetch list shares"
}
```

**Storage Method:** `storage.getListShares()`

**Notes:**
- Only list creator can view shares (not shared users)

---

### 15.2 POST /api/organizations/:orgId/lists/:listId/shares

**Purpose:** Share a list with another user

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID
- `listId` - List ID

**Request Body:**
```typescript
{
  sharedWithUserId: string;  // Required: User ID to share with
}
```

**Validation Schema:** `insertListShareSchema`

**Response (Success - 200):**
```typescript
{
  id: string;
  listId: string;
  sharedWithUserId: string;
  sharedBy: string;  // Automatically set to current user ID
  sharedAt: Date;
}
```

**Response (Error - 400/403/500):**
```typescript
{
  message: "sharedWithUserId is required"
    | "Only list creator can share"
    | "List already shared with this user"
    | "Validation error"
    | "Failed to share list"
}
```

**Storage Method:** `storage.shareList()`

**Error Codes:**
- `23505` - Unique constraint violation (`unique_list_share`)
- `ZodError` - Validation error

**Notes:**
- Only list creator can share
- Unique constraint prevents sharing with same user multiple times

---

### 15.3 DELETE /api/organizations/:orgId/lists/:listId/shares/:userId

**Purpose:** Unshare a list (remove shared access)

**Authentication:** Required (`isAuthenticated`, `checkOrganizationAccess`)

**URL Parameters:**
- `orgId` - Organization ID (not used but required for middleware)
- `listId` - List ID
- `userId` - User ID to remove share from (sharedWithUserId)

**Response (Success - 200):**
```typescript
{
  success: true
}
```

**Response (Error - 403/500):**
```typescript
{
  message: "Only list creator can unshare" | "Failed to unshare list"
}
```

**Storage Method:** `storage.unshareList()`

**Notes:**
- Only list creator can unshare

---

## 16. AI Assistant Endpoints

### 16.1 POST /api/assistant/chat

**Purpose:** Send messages to AI assistant for contextual help

**Authentication:** Required (`isAuthenticated`)

**Request Body:**
```typescript
{
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  context?: {           // Optional page context
    page?: string;
    studentName?: string;
    data?: any;
  };
}
```

**Response (Success - 200):**
```typescript
{
  message: string;  // AI assistant's response
}
```

**Response (Error - 400/500):**
```typescript
{
  error: "Invalid messages format" | "Failed to get AI response"
}
```

**Service Method:** `getChatCompletion()` (from openai.ts)

**Notes:**
- Uses OpenAI GPT-5 model
- Requires `OPENAI_API_KEY` environment variable
- Messages array must be valid

---

### 16.2 POST /api/transcribe

**Purpose:** Transcribe audio using OpenAI Whisper API

**Authentication:** Required (`isAuthenticated`)

**Request Body:**
```typescript
{
  audio: string;       // Required: Base64-encoded audio data
  filename?: string;   // Optional: Filename (defaults to "audio.webm")
}
```

**Response (Success - 200):**
```typescript
{
  text: string;               // Transcribed text
  language?: string;          // Detected language
  segments?: Array<{          // Optional timestamp segments
    start: number;
    end: number;
    text: string;
  }>;
}
```

**Response (Error - 400/500):**
```typescript
{
  error: string;    // User-friendly error message
  message: string;  // Technical error message
}
```

**Service Method:** `transcribeAudio()` (from openai.ts)

**Error Messages:**
- "Audio data is required" (400)
- "Invalid audio data" (400)
- "Audio file too large. Maximum size is 25MB." (400)
- "OpenAI API key is missing or invalid..." (500)
- "Transcription request timed out..." (500)
- "OpenAI API rate limit exceeded..." (500)

**Notes:**
- Maximum file size: 25MB (Whisper API limit)
- Audio is converted from base64 to Buffer
- Requires `OPENAI_API_KEY` environment variable

---

### 16.3 POST /api/generate-meeting-summary

**Purpose:** Generate AI-powered meeting summary from notes and transcript

**Authentication:** Required (`isAuthenticated`)

**Request Body:**
```typescript
{
  notes?: string;       // Optional meeting notes
  transcript?: string;  // Optional audio transcript
}
```

**Response (Success - 200):**
```typescript
{
  summary: string;  // AI-generated structured summary with key points, action items, recommendations
}
```

**Response (Error - 400/500):**
```typescript
{
  error: string;    // User-friendly error message
  message: string;  // Technical error message
}
```

**Service Method:** `generateMeetingSummary()` (from openai.ts)

**Error Messages:**
- "At least notes or transcript is required to generate a summary" (400)
- "OpenAI API key is missing or invalid." (500)
- "Failed to generate meeting summary" (500)

**Notes:**
- Uses OpenAI GPT-5 model
- Requires at least one of notes or transcript
- Generates structured summary with key points, action items, and recommendations
- Summary appears in conditional "Summary" tab after generation

---

## 17. Summary Statistics

### Total Endpoints: 77

**Breakdown by Category:**
- Authentication: 5 endpoints
- Organizations: 4 endpoints
- Students: 4 endpoints
- Behavior Logs: 6 endpoints
- Behavior Log Categories: 4 endpoints
- Academic Logs: 6 endpoints
- Subjects: 4 endpoints
- Academic Log Categories: 4 endpoints
- Meeting Notes: 2 endpoints
- Tasks/Follow-ups: 5 endpoints
- Classes: 5 endpoints
- Student Resources: 3 endpoints
- Lists: 5 endpoints
- List Items: 3 endpoints
- List Sharing: 3 endpoints
- AI Assistant: 3 endpoints

### Authentication Patterns

**Public endpoints (5):**
- POST /api/auth/signup
- POST /api/auth/resend-confirmation
- POST /api/auth/login
- POST /api/auth/logout
- (GET /api/auth/user - technically requires authentication)

**isAuthenticated only (4):**
- GET /api/auth/user
- POST /api/assistant/chat
- POST /api/transcribe
- POST /api/generate-meeting-summary

**isAuthenticated + checkOrganizationAccess (68):**
- All other endpoints

### Common Validation Schemas

Defined in `shared/schema.ts`:
- `signupSchema` (inline Zod)
- `loginSchema` (inline Zod)
- `insertOrganizationSchema`
- `insertStudentSchema`
- `insertBehaviorLogSchema`
- `insertBehaviorLogCategorySchema`
- `insertAcademicLogSchema`
- `insertAcademicLogCategorySchema`
- `insertSubjectSchema`
- `insertMeetingNoteSchema`
- `insertTaskSchema`
- `insertClassSchema`
- `insertStudentResourceSchema`
- `insertListSchema`
- `insertListItemSchema`
- `insertListShareSchema`

### Common Error Codes

**Database Constraint Errors:**
- `23503` - Foreign key constraint violation
- `23505` - Unique constraint violation
- `23502` - NOT NULL constraint violation

**Validation Errors:**
- `ZodError` - Schema validation failure

### Multi-Tenant Security

**All organization-scoped routes:**
- Include `checkOrganizationAccess` middleware
- All data queries filter by `organizationId`
- Organization access validated via `organization_users` junction table
- Prevents cross-organization data access

### Storage Layer

All endpoints use methods from `server/storage.ts`:
- Interface-based storage system (`IStorage`)
- `DatabaseStorage` implementation with PostgreSQL
- Drizzle ORM for type-safe database operations
- Multi-tenant architecture with organization-scoped data access

---

**End of Documentation**

For implementation details, see:
- `server/routes.ts` - All API endpoint definitions
- `shared/schema.ts` - Database schema and validation
- `server/storage.ts` - Storage layer methods
- `server/openai.ts` - AI service integration
