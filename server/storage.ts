import {
  users,
  organizations,
  organizationUsers,
  students,
  behaviorLogs,
  behaviorLogCategories,
  meetingNotes,
  followUps,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type OrganizationUser,
  type InsertOrganizationUser,
  type Student,
  type InsertStudent,
  type BehaviorLog,
  type InsertBehaviorLog,
  type BehaviorLogCategory,
  type InsertBehaviorLogCategory,
  type MeetingNote,
  type InsertMeetingNote,
  type FollowUp,
  type InsertFollowUp,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface DashboardStats {
  totalStudents: number;
  totalBehaviorLogs: number;
  pendingFollowUps: number;
  positiveLogsPercentage: number;
}

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<Organization[]>;
  getDashboardStats(organizationId: string): Promise<DashboardStats>;
  
  // Organization User operations
  addUserToOrganization(data: InsertOrganizationUser): Promise<OrganizationUser>;
  getOrganizationUsers(organizationId: string): Promise<(OrganizationUser & { user: User })[]>;
  
  // Student operations
  getStudents(organizationId: string): Promise<Student[]>;
  getStudent(id: string, organizationId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, organizationId: string, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: string, organizationId: string): Promise<void>;
  
  // Behavior Log operations
  getBehaviorLogs(studentId: string, organizationId: string): Promise<BehaviorLog[]>;
  getAllBehaviorLogs(organizationId: string): Promise<BehaviorLog[]>;
  getBehaviorLog(id: string, organizationId: string): Promise<BehaviorLog | undefined>;
  createBehaviorLog(log: InsertBehaviorLog): Promise<BehaviorLog>;
  updateBehaviorLog(id: string, organizationId: string, log: Partial<InsertBehaviorLog>): Promise<BehaviorLog>;
  deleteBehaviorLog(id: string, organizationId: string): Promise<void>;
  
  // Meeting Note operations
  getMeetingNotes(studentId: string, organizationId: string): Promise<MeetingNote[]>;
  createMeetingNote(note: InsertMeetingNote): Promise<MeetingNote>;
  
  // Follow-up operations
  getFollowUps(studentId: string, organizationId: string): Promise<FollowUp[]>;
  getAllFollowUps(organizationId: string): Promise<FollowUp[]>;
  createFollowUp(followUp: InsertFollowUp): Promise<FollowUp>;
  updateFollowUp(id: string, organizationId: string, followUp: Partial<InsertFollowUp>): Promise<FollowUp>;
  deleteFollowUp(id: string, organizationId: string): Promise<void>;
  
  // Behavior Log Category operations
  getBehaviorLogCategories(organizationId: string): Promise<BehaviorLogCategory[]>;
  createBehaviorLogCategory(category: InsertBehaviorLogCategory): Promise<BehaviorLogCategory>;
  updateBehaviorLogCategory(id: string, organizationId: string, category: Partial<InsertBehaviorLogCategory>): Promise<BehaviorLogCategory>;
  deleteBehaviorLogCategory(id: string, organizationId: string): Promise<void>;
  seedDefaultCategories(organizationId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Organization operations
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db.insert(organizations).values(org).returning();
    // Seed default categories for the new organization
    await this.seedDefaultCategories(organization.id);
    return organization;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    return organization;
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        code: organizations.code,
        email: organizations.email,
        phone: organizations.phone,
        address: organizations.address,
        ownerId: organizations.ownerId,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizationUsers)
      .innerJoin(organizations, eq(organizationUsers.organizationId, organizations.id))
      .where(eq(organizationUsers.userId, userId));
    return orgs;
  }

  async getDashboardStats(organizationId: string): Promise<DashboardStats> {
    const studentsData = await db.select().from(students).where(eq(students.organizationId, organizationId));
    const behaviorLogsData = await db.select().from(behaviorLogs).where(eq(behaviorLogs.organizationId, organizationId));
    const followUpsData = await db.select().from(followUps).where(eq(followUps.organizationId, organizationId));

    const totalStudents = studentsData.length;
    const totalBehaviorLogs = behaviorLogsData.length;
    
    // Count follow-ups that are not Done or Archived
    const pendingFollowUps = followUpsData.filter(fu => 
      fu.status !== "Done" && fu.status !== "Archived"
    ).length;
    
    // Category is stored as varchar, ensure exact match
    const positiveLogs = behaviorLogsData.filter(log => 
      log.category?.toLowerCase() === "positive"
    ).length;
    const positiveLogsPercentage = totalBehaviorLogs > 0 
      ? Math.round((positiveLogs / totalBehaviorLogs) * 100) 
      : 0;

    return {
      totalStudents,
      totalBehaviorLogs,
      pendingFollowUps,
      positiveLogsPercentage,
    };
  }

  // Organization User operations
  async addUserToOrganization(data: InsertOrganizationUser): Promise<OrganizationUser> {
    const [orgUser] = await db.insert(organizationUsers).values(data).returning();
    return orgUser;
  }

  async getOrganizationUsers(organizationId: string): Promise<(OrganizationUser & { user: User })[]> {
    const results = await db
      .select({
        id: organizationUsers.id,
        userId: organizationUsers.userId,
        organizationId: organizationUsers.organizationId,
        role: organizationUsers.role,
        joinedAt: organizationUsers.joinedAt,
        user: users,
      })
      .from(organizationUsers)
      .innerJoin(users, eq(organizationUsers.userId, users.id))
      .where(eq(organizationUsers.organizationId, organizationId));
    return results;
  }

  // Student operations
  async getStudents(organizationId: string): Promise<Student[]> {
    return db.select().from(students).where(eq(students.organizationId, organizationId));
  }

  async getStudent(id: string, organizationId: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, id), eq(students.organizationId, organizationId)));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    if (student.email) {
      const existingStudent = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.organizationId, student.organizationId),
            eq(students.email, student.email)
          )
        );
      
      if (existingStudent.length > 0) {
        throw new Error(`A student with email ${student.email} already exists in this organization`);
      }
    }
    
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: string, organizationId: string, student: Partial<InsertStudent>): Promise<Student> {
    const [updated] = await db
      .update(students)
      .set({ ...student, updatedAt: new Date() })
      .where(and(eq(students.id, id), eq(students.organizationId, organizationId)))
      .returning();
    return updated;
  }

  async deleteStudent(id: string, organizationId: string): Promise<void> {
    await db.delete(students).where(and(eq(students.id, id), eq(students.organizationId, organizationId)));
  }

  // Behavior Log operations
  async getBehaviorLogs(studentId: string, organizationId: string): Promise<BehaviorLog[]> {
    return db
      .select()
      .from(behaviorLogs)
      .where(and(eq(behaviorLogs.studentId, studentId), eq(behaviorLogs.organizationId, organizationId)));
  }

  async getAllBehaviorLogs(organizationId: string): Promise<BehaviorLog[]> {
    return db.select().from(behaviorLogs).where(eq(behaviorLogs.organizationId, organizationId));
  }

  async getBehaviorLog(id: string, organizationId: string): Promise<BehaviorLog | undefined> {
    const [log] = await db
      .select()
      .from(behaviorLogs)
      .where(and(eq(behaviorLogs.id, id), eq(behaviorLogs.organizationId, organizationId)));
    return log;
  }

  async createBehaviorLog(log: InsertBehaviorLog): Promise<BehaviorLog> {
    const [newLog] = await db.insert(behaviorLogs).values(log).returning();
    return newLog;
  }

  async updateBehaviorLog(id: string, organizationId: string, log: Partial<InsertBehaviorLog>): Promise<BehaviorLog> {
    const [updated] = await db
      .update(behaviorLogs)
      .set(log)
      .where(and(eq(behaviorLogs.id, id), eq(behaviorLogs.organizationId, organizationId)))
      .returning();
    return updated;
  }

  async deleteBehaviorLog(id: string, organizationId: string): Promise<void> {
    await db.delete(behaviorLogs).where(and(eq(behaviorLogs.id, id), eq(behaviorLogs.organizationId, organizationId)));
  }

  // Meeting Note operations
  async getMeetingNotes(studentId: string, organizationId: string): Promise<MeetingNote[]> {
    return db
      .select()
      .from(meetingNotes)
      .where(and(eq(meetingNotes.studentId, studentId), eq(meetingNotes.organizationId, organizationId)));
  }

  async createMeetingNote(note: InsertMeetingNote): Promise<MeetingNote> {
    const [newNote] = await db.insert(meetingNotes).values(note).returning();
    return newNote;
  }

  // Follow-up operations
  async getFollowUps(studentId: string, organizationId: string): Promise<FollowUp[]> {
    return db
      .select()
      .from(followUps)
      .where(and(eq(followUps.studentId, studentId), eq(followUps.organizationId, organizationId)));
  }

  async getAllFollowUps(organizationId: string): Promise<FollowUp[]> {
    return db.select().from(followUps).where(eq(followUps.organizationId, organizationId));
  }

  async createFollowUp(followUp: InsertFollowUp): Promise<FollowUp> {
    const [newFollowUp] = await db.insert(followUps).values(followUp).returning();
    return newFollowUp;
  }

  async updateFollowUp(id: string, organizationId: string, followUp: Partial<InsertFollowUp>): Promise<FollowUp> {
    const [updated] = await db
      .update(followUps)
      .set(followUp)
      .where(and(eq(followUps.id, id), eq(followUps.organizationId, organizationId)))
      .returning();
    return updated;
  }

  async deleteFollowUp(id: string, organizationId: string): Promise<void> {
    await db
      .delete(followUps)
      .where(and(eq(followUps.id, id), eq(followUps.organizationId, organizationId)));
  }

  // Behavior Log Category operations
  async getBehaviorLogCategories(organizationId: string): Promise<BehaviorLogCategory[]> {
    const results = await db
      .select()
      .from(behaviorLogCategories)
      .where(eq(behaviorLogCategories.organizationId, organizationId));
    
    // Sort manually since Drizzle's orderBy might not support multiple columns in this way
    return results.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }

  async createBehaviorLogCategory(category: InsertBehaviorLogCategory): Promise<BehaviorLogCategory> {
    const [newCategory] = await db
      .insert(behaviorLogCategories)
      .values({
        ...category,
        updatedAt: new Date(),
      })
      .returning();
    return newCategory;
  }

  async updateBehaviorLogCategory(
    id: string,
    organizationId: string,
    category: Partial<InsertBehaviorLogCategory>
  ): Promise<BehaviorLogCategory> {
    const [updated] = await db
      .update(behaviorLogCategories)
      .set({
        ...category,
        updatedAt: new Date(),
      })
      .where(and(eq(behaviorLogCategories.id, id), eq(behaviorLogCategories.organizationId, organizationId)))
      .returning();
    
    if (!updated) {
      throw new Error(`Category with id ${id} not found in organization ${organizationId}`);
    }
    
    return updated;
  }

  async deleteBehaviorLogCategory(id: string, organizationId: string): Promise<void> {
    await db
      .delete(behaviorLogCategories)
      .where(and(eq(behaviorLogCategories.id, id), eq(behaviorLogCategories.organizationId, organizationId)));
  }

  async seedDefaultCategories(organizationId: string): Promise<void> {
    const defaultCategories: InsertBehaviorLogCategory[] = [
      {
        organizationId,
        name: "Positive",
        description: "Positive behavior and achievements",
        color: "green",
        displayOrder: 0,
      },
      {
        organizationId,
        name: "Neutral",
        description: "General observations and notes",
        color: "blue",
        displayOrder: 1,
      },
      {
        organizationId,
        name: "Concern",
        description: "Minor concerns requiring attention",
        color: "amber",
        displayOrder: 2,
      },
      {
        organizationId,
        name: "Serious",
        description: "Serious incidents requiring immediate action",
        color: "red",
        displayOrder: 3,
      },
    ];

    // Check if categories already exist to avoid duplicates
    const existing = await this.getBehaviorLogCategories(organizationId);
    if (existing.length === 0) {
      await db.insert(behaviorLogCategories).values(defaultCategories);
    }
  }
}

export const storage = new DatabaseStorage();
