import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Organizations table
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Organization Users (many-to-many relationship)
export const organizationUsers = pgTable("organization_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  role: varchar("role", { length: 50 }).notNull().default("teacher"), // owner, admin, teacher
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertOrganizationUserSchema = createInsertSchema(organizationUsers).omit({
  id: true,
  joinedAt: true,
});

export type InsertOrganizationUser = z.infer<typeof insertOrganizationUserSchema>;
export type OrganizationUser = typeof organizationUsers.$inferSelect;

// Classes table
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  classId: varchar("class_id").references(() => classes.id),
  gender: varchar("gender", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueEmailPerOrg: uniqueIndex("unique_email_per_org").on(table.organizationId, table.email),
}));

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Behavior Logs table
export const behaviorLogs = pgTable("behavior_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  studentId: varchar("student_id").notNull().references(() => students.id),
  categoryId: varchar("category_id").notNull().references(() => behaviorLogCategories.id, { onDelete: "restrict" }),
  incidentDate: timestamp("incident_date").notNull(),
  notes: text("notes").notNull(),
  strategies: text("strategies"),
  loggedBy: varchar("logged_by", { length: 255 }).notNull(),
  loggedAt: timestamp("logged_at").defaultNow(),
});

export const insertBehaviorLogSchema = createInsertSchema(behaviorLogs).omit({
  id: true,
  loggedAt: true,
});

export type InsertBehaviorLog = z.infer<typeof insertBehaviorLogSchema>;
export type BehaviorLog = typeof behaviorLogs.$inferSelect;

// Behavior Log Categories table
export const behaviorLogCategories = pgTable("behavior_log_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 50 }), // e.g., "green", "blue", "amber", "red" or hex codes
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBehaviorLogCategorySchema = createInsertSchema(behaviorLogCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBehaviorLogCategory = z.infer<typeof insertBehaviorLogCategorySchema>;
export type BehaviorLogCategory = typeof behaviorLogCategories.$inferSelect;

// Meeting Notes table
export const meetingNotes = pgTable("meeting_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  studentId: varchar("student_id").notNull().references(() => students.id),
  date: timestamp("date").notNull(),
  participants: text("participants").array().notNull(),
  summary: text("summary").notNull(),
  fullNotes: text("full_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMeetingNoteSchema = createInsertSchema(meetingNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertMeetingNote = z.infer<typeof insertMeetingNoteSchema>;
export type MeetingNote = typeof meetingNotes.$inferSelect;

// Tasks table
export const tasks = pgTable("follow_ups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  studentId: varchar("student_id").notNull().references(() => students.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"), // Rich text content
  dueDate: timestamp("due_date"),
  status: varchar("status", { length: 50 }).notNull().default("To-Do"), // To-Do, In-Progress, Done, Archived
  assignee: varchar("assignee", { length: 255 }), // User assigned to this task
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;

// Base task type from database
type BaseTask = typeof tasks.$inferSelect;

// Task type with assignee as object
export type Task = Omit<BaseTask, 'assignee'> & {
  assignee: { id: string; name: string } | null;
};

// Student Resources table
export const studentResources = pgTable("student_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  studentId: varchar("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentResourceSchema = createInsertSchema(studentResources).omit({
  id: true,
  createdAt: true,
});

export type InsertStudentResource = z.infer<typeof insertStudentResourceSchema>;
export type StudentResource = typeof studentResources.$inferSelect;

// Subjects table
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false), // True for system-provided defaults
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

// Academic Log Categories table
export const academicLogCategories = pgTable("academic_log_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 50 }), // e.g., "green", "blue", "amber", "orange", "red"
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAcademicLogCategorySchema = createInsertSchema(academicLogCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAcademicLogCategory = z.infer<typeof insertAcademicLogCategorySchema>;
export type AcademicLogCategory = typeof academicLogCategories.$inferSelect;

// Academic Logs table
export const academicLogs = pgTable("academic_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  studentId: varchar("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id, { onDelete: "restrict" }),
  categoryId: varchar("category_id").notNull().references(() => academicLogCategories.id, { onDelete: "restrict" }),
  assessmentDate: timestamp("assessment_date").notNull(),
  grade: varchar("grade", { length: 20 }), // Optional: "A", "B+", "Pass", etc.
  score: varchar("score", { length: 50 }), // Optional: "85%", "90/100", "4.0", etc.
  notes: text("notes").notNull(),
  loggedBy: varchar("logged_by", { length: 255 }).notNull(),
  loggedAt: timestamp("logged_at").defaultNow(),
});

export const insertAcademicLogSchema = createInsertSchema(academicLogs).omit({
  id: true,
  loggedAt: true,
});

export type InsertAcademicLog = z.infer<typeof insertAcademicLogSchema>;
export type AcademicLog = typeof academicLogs.$inferSelect;

// Lists table - Custom lists for organizing students, behavior logs, academic logs
export const lists = pgTable("lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // "students", "behavior_logs", "academic_logs"
  createdBy: varchar("created_by", { length: 255 }).notNull(), // User email/name who created
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertListSchema = createInsertSchema(lists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertList = z.infer<typeof insertListSchema>;
export type List = typeof lists.$inferSelect & {
  createdByUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
};

// List Items table - Junction table for list contents (polymorphic)
export const listItems = pgTable(
  "list_items",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    listId: varchar("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),

    // Polymorphic references - only one should be populated based on list.type
    studentId: varchar("student_id").references(() => students.id, { onDelete: "cascade" }),
    behaviorLogId: varchar("behavior_log_id").references(() => behaviorLogs.id, { onDelete: "cascade" }),
    academicLogId: varchar("academic_log_id").references(() => academicLogs.id, { onDelete: "cascade" }),

    addedBy: varchar("added_by", { length: 255 }).notNull(), // User who added this item
    addedAt: timestamp("added_at").defaultNow(),
    notes: text("notes"), // Optional notes about why item is in list
  },
  (table) => [
    // Unique constraints to prevent duplicates
    uniqueIndex("unique_list_student").on(table.listId, table.studentId),
    uniqueIndex("unique_list_behavior_log").on(table.listId, table.behaviorLogId),
    uniqueIndex("unique_list_academic_log").on(table.listId, table.academicLogId),
  ]
);

export const insertListItemSchema = createInsertSchema(listItems).omit({
  id: true,
  addedAt: true,
});

export type InsertListItem = z.infer<typeof insertListItemSchema>;
export type ListItem = typeof listItems.$inferSelect & {
  addedByUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
};

// List Shares table - Tracks who lists are shared with
export const listShares = pgTable(
  "list_shares",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    listId: varchar("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    sharedWithUserId: varchar("shared_with_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sharedBy: varchar("shared_by", { length: 255 }).notNull(), // User who shared
    sharedAt: timestamp("shared_at").defaultNow(),
  },
  (table) => [
    // Prevent sharing with same user multiple times
    uniqueIndex("unique_list_share").on(table.listId, table.sharedWithUserId),
  ]
);

export const insertListShareSchema = createInsertSchema(listShares).omit({
  id: true,
  sharedAt: true,
});

export type InsertListShare = z.infer<typeof insertListShareSchema>;
export type ListShare = typeof listShares.$inferSelect;
