import {
  users,
  organizations,
  organizationUsers,
  students,
  behaviorLogs,
  behaviorLogCategories,
  meetingNotes,
  followUps,
  classes,
  studentResources,
  subjects,
  academicLogCategories,
  academicLogs,
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
  type Class,
  type InsertClass,
  type StudentResource,
  type InsertStudentResource,
  type Subject,
  type InsertSubject,
  type AcademicLogCategory,
  type InsertAcademicLogCategory,
  type AcademicLog,
  type InsertAcademicLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ne, sql } from "drizzle-orm";

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
  updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization>;
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
  
  // Class operations
  getClasses(organizationId: string): Promise<Class[]>;
  getClass(id: string, organizationId: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, organizationId: string, classData: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: string, organizationId: string): Promise<void>;

  // Student Resource operations
  getStudentResources(studentId: string, organizationId: string): Promise<StudentResource[]>;
  createStudentResource(resource: InsertStudentResource): Promise<StudentResource>;
  deleteStudentResource(id: string, organizationId: string): Promise<void>;

  // Subject operations
  getSubjects(organizationId: string): Promise<Subject[]>;
  getSubject(id: string, organizationId: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, organizationId: string, subject: Partial<InsertSubject>): Promise<Subject>;
  deleteSubject(id: string, organizationId: string): Promise<void>;
  seedDefaultSubjects(organizationId: string): Promise<void>;

  // Academic Log Category operations
  getAcademicLogCategories(organizationId: string): Promise<AcademicLogCategory[]>;
  createAcademicLogCategory(category: InsertAcademicLogCategory): Promise<AcademicLogCategory>;
  updateAcademicLogCategory(id: string, organizationId: string, category: Partial<InsertAcademicLogCategory>): Promise<AcademicLogCategory>;
  deleteAcademicLogCategory(id: string, organizationId: string): Promise<void>;
  seedDefaultAcademicCategories(organizationId: string): Promise<void>;

  // Academic Log operations
  getAcademicLogs(studentId: string, organizationId: string): Promise<AcademicLog[]>;
  getAllAcademicLogs(organizationId: string): Promise<AcademicLog[]>;
  getAcademicLog(id: string, organizationId: string): Promise<AcademicLog | undefined>;
  createAcademicLog(log: InsertAcademicLog): Promise<AcademicLog>;
  updateAcademicLog(id: string, organizationId: string, log: Partial<InsertAcademicLog>): Promise<AcademicLog>;
  deleteAcademicLog(id: string, organizationId: string): Promise<void>;
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

  async updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization> {
    const [updatedOrganization] = await db
      .update(organizations)
      .set({ ...org, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();

    if (!updatedOrganization) {
      throw new Error("Organization not found");
    }

    return updatedOrganization;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getDashboardStats(organizationId: string): Promise<DashboardStats> {
    const studentsData = await db.select().from(students).where(eq(students.organizationId, organizationId));
    const followUpsData = await db.select().from(followUps).where(eq(followUps.organizationId, organizationId));
    
    // Get behavior logs with category information
    const behaviorLogsData = await db
      .select({
        id: behaviorLogs.id,
        categoryName: behaviorLogCategories.name,
      })
      .from(behaviorLogs)
      .innerJoin(behaviorLogCategories, eq(behaviorLogs.categoryId, behaviorLogCategories.id))
      .where(eq(behaviorLogs.organizationId, organizationId));

    const totalStudents = studentsData.length;
    const totalBehaviorLogs = behaviorLogsData.length;
    
    // Count follow-ups that are not Done or Archived
    const pendingFollowUps = followUpsData.filter(fu => 
      fu.status !== "Done" && fu.status !== "Archived"
    ).length;
    
    // Count positive logs by joining with categories
    const positiveLogs = behaviorLogsData.filter(log => 
      log.categoryName?.toLowerCase() === "positive"
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
  async getStudents(organizationId: string): Promise<(Student & { behaviorLogsCount: number; academicLogsCount: number })[]> {
    const result = await db
      .select({
        id: students.id,
        organizationId: students.organizationId,
        name: students.name,
        email: students.email,
        classId: students.classId,
        gender: students.gender,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
        behaviorLogsCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM behavior_logs
          WHERE behavior_logs.student_id = students.id
        )`,
        academicLogsCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM academic_logs
          WHERE academic_logs.student_id = students.id
        )`,
      })
      .from(students)
      .where(eq(students.organizationId, organizationId));

    return result;
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
    console.log(`[DEBUG Storage] updateStudent called:`, {
      id,
      organizationId,
      student,
    });

    // Check if email is being updated and if it conflicts with existing student
    if (student.email) {
      const existingStudent = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.organizationId, organizationId),
            eq(students.email, student.email),
            // Exclude current student from check
            ne(students.id, id)
          )
        );

      if (existingStudent.length > 0) {
        throw new Error(`A student with email ${student.email} already exists in this organization`);
      }
    }

    // Validate classId if being updated
    if (student.classId !== undefined && student.classId !== null) {
      const classExists = await db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.id, student.classId),
            eq(classes.organizationId, organizationId)
          )
        )
        .limit(1);

      if (classExists.length === 0) {
        throw new Error(`Class with id ${student.classId} not found in organization ${organizationId}`);
      }
    }

    const [updated] = await db
      .update(students)
      .set({ ...student, updatedAt: new Date() })
      .where(and(eq(students.id, id), eq(students.organizationId, organizationId)))
      .returning();

    if (!updated) {
      throw new Error(`Student with id ${id} not found in organization ${organizationId}`);
    }

    console.log(`[DEBUG Storage] Student updated successfully:`, updated);
    return updated;
  }

  async deleteStudent(id: string, organizationId: string): Promise<void> {
    await db.delete(students).where(and(eq(students.id, id), eq(students.organizationId, organizationId)));
  }

  // Behavior Log operations
  async getBehaviorLogs(studentId: string, organizationId: string): Promise<any[]> {
    const logs = await db
      .select({
        id: behaviorLogs.id,
        organizationId: behaviorLogs.organizationId,
        studentId: behaviorLogs.studentId,
        categoryId: behaviorLogs.categoryId,
        incidentDate: behaviorLogs.incidentDate,
        notes: behaviorLogs.notes,
        strategies: behaviorLogs.strategies,
        loggedBy: behaviorLogs.loggedBy,
        loggedAt: behaviorLogs.loggedAt,
        student: {
          id: students.id,
          name: students.name,
          email: students.email,
          classId: students.classId,
        },
        category: {
          id: behaviorLogCategories.id,
          name: behaviorLogCategories.name,
          color: behaviorLogCategories.color,
        },
        class: {
          id: classes.id,
          name: classes.name,
        },
      })
      .from(behaviorLogs)
      .leftJoin(students, eq(behaviorLogs.studentId, students.id))
      .leftJoin(behaviorLogCategories, eq(behaviorLogs.categoryId, behaviorLogCategories.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(and(eq(behaviorLogs.studentId, studentId), eq(behaviorLogs.organizationId, organizationId)))
      .orderBy(behaviorLogs.incidentDate);

    return logs;
  }

  async getAllBehaviorLogs(organizationId: string): Promise<any[]> {
    const logs = await db
      .select({
        id: behaviorLogs.id,
        organizationId: behaviorLogs.organizationId,
        studentId: behaviorLogs.studentId,
        categoryId: behaviorLogs.categoryId,
        incidentDate: behaviorLogs.incidentDate,
        notes: behaviorLogs.notes,
        strategies: behaviorLogs.strategies,
        loggedBy: behaviorLogs.loggedBy,
        loggedAt: behaviorLogs.loggedAt,
        student: {
          id: students.id,
          name: students.name,
          email: students.email,
          classId: students.classId,
        },
        category: {
          id: behaviorLogCategories.id,
          name: behaviorLogCategories.name,
          color: behaviorLogCategories.color,
        },
        class: {
          id: classes.id,
          name: classes.name,
        },
      })
      .from(behaviorLogs)
      .leftJoin(students, eq(behaviorLogs.studentId, students.id))
      .leftJoin(behaviorLogCategories, eq(behaviorLogs.categoryId, behaviorLogCategories.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(eq(behaviorLogs.organizationId, organizationId))
      .orderBy(behaviorLogs.incidentDate);

    return logs;
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
    console.log(`[DEBUG Storage] updateFollowUp called with:`, {
      id,
      organizationId,
      followUp,
      followUpKeys: Object.keys(followUp),
    });

    // Filter out undefined values to ensure we only update provided fields
    // This prevents null constraint violations when doing partial updates
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only include fields that are explicitly provided (not undefined)
    if (followUp.title !== undefined) updateData.title = followUp.title;
    if (followUp.description !== undefined) updateData.description = followUp.description;
    if (followUp.status !== undefined) updateData.status = followUp.status;
    if (followUp.assignee !== undefined) updateData.assignee = followUp.assignee;
    if (followUp.dueDate !== undefined) updateData.dueDate = followUp.dueDate;

    console.log(`[DEBUG Storage] Final updateData to be sent to DB:`, updateData);

    const [updated] = await db
      .update(followUps)
      .set(updateData)
      .where(and(eq(followUps.id, id), eq(followUps.organizationId, organizationId)))
      .returning();

    if (!updated) {
      throw new Error("Follow-up not found");
    }

    console.log(`[DEBUG Storage] Follow-up updated successfully:`, updated);
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

  // Class operations
  async getClasses(organizationId: string): Promise<Class[]> {
    return await db
      .select()
      .from(classes)
      .where(eq(classes.organizationId, organizationId));
  }

  async getClass(id: string, organizationId: string): Promise<Class | undefined> {
    const [classData] = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, id), eq(classes.organizationId, organizationId)));
    return classData;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db
      .insert(classes)
      .values({
        ...classData,
        updatedAt: new Date(),
      })
      .returning();
    return newClass;
  }

  async updateClass(
    id: string,
    organizationId: string,
    classData: Partial<InsertClass>
  ): Promise<Class> {
    const [updated] = await db
      .update(classes)
      .set({
        ...classData,
        updatedAt: new Date(),
      })
      .where(and(eq(classes.id, id), eq(classes.organizationId, organizationId)))
      .returning();
    
    if (!updated) {
      throw new Error(`Class with id ${id} not found in organization ${organizationId}`);
    }
    
    return updated;
  }

  async deleteClass(id: string, organizationId: string): Promise<void> {
    // Check if any students are assigned to this class
    const studentsWithClass = await db
      .select()
      .from(students)
      .where(and(eq(students.classId, id), eq(students.organizationId, organizationId)))
      .limit(1);

    if (studentsWithClass.length > 0) {
      throw new Error("Cannot delete class with assigned students. Please unassign students first or archive the class instead.");
    }

    await db
      .delete(classes)
      .where(and(eq(classes.id, id), eq(classes.organizationId, organizationId)));
  }

  // Student Resource operations
  async getStudentResources(studentId: string, organizationId: string): Promise<StudentResource[]> {
    return await db
      .select()
      .from(studentResources)
      .where(
        and(
          eq(studentResources.studentId, studentId),
          eq(studentResources.organizationId, organizationId)
        )
      );
  }

  async createStudentResource(resource: InsertStudentResource): Promise<StudentResource> {
    const [newResource] = await db
      .insert(studentResources)
      .values(resource)
      .returning();
    return newResource;
  }

  async deleteStudentResource(id: string, organizationId: string): Promise<void> {
    await db
      .delete(studentResources)
      .where(
        and(
          eq(studentResources.id, id),
          eq(studentResources.organizationId, organizationId)
        )
      );
  }

  // Subject operations
  async getSubjects(organizationId: string): Promise<Subject[]> {
    const results = await db
      .select()
      .from(subjects)
      .where(eq(subjects.organizationId, organizationId));

    // Sort: defaults first, then by name
    return results.sort((a, b) => {
      if (a.isDefault !== b.isDefault) {
        return a.isDefault ? -1 : 1;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }

  async getSubject(id: string, organizationId: string): Promise<Subject | undefined> {
    const [subject] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.organizationId, organizationId)));
    return subject;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db
      .insert(subjects)
      .values({
        ...subject,
        updatedAt: new Date(),
      })
      .returning();
    return newSubject;
  }

  async updateSubject(id: string, organizationId: string, subject: Partial<InsertSubject>): Promise<Subject> {
    const [updated] = await db
      .update(subjects)
      .set({
        ...subject,
        updatedAt: new Date(),
      })
      .where(and(eq(subjects.id, id), eq(subjects.organizationId, organizationId)))
      .returning();

    if (!updated) {
      throw new Error(`Subject with id ${id} not found in organization ${organizationId}`);
    }

    return updated;
  }

  async deleteSubject(id: string, organizationId: string): Promise<void> {
    await db
      .delete(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.organizationId, organizationId)));
  }

  async seedDefaultSubjects(organizationId: string): Promise<void> {
    const defaultSubjects: InsertSubject[] = [
      {
        organizationId,
        name: "Mathematics",
        code: "MATH",
        description: "Mathematics and numerical reasoning",
        isDefault: true,
        isArchived: false,
      },
      {
        organizationId,
        name: "English",
        code: "ENG",
        description: "English language and literature",
        isDefault: true,
        isArchived: false,
      },
      {
        organizationId,
        name: "Science",
        code: "SCI",
        description: "General science",
        isDefault: true,
        isArchived: false,
      },
      {
        organizationId,
        name: "History",
        code: "HIST",
        description: "History and social studies",
        isDefault: true,
        isArchived: false,
      },
      {
        organizationId,
        name: "Geography",
        code: "GEO",
        description: "Geography and earth sciences",
        isDefault: true,
        isArchived: false,
      },
      {
        organizationId,
        name: "Physical Education",
        code: "PE",
        description: "Physical education and sports",
        isDefault: true,
        isArchived: false,
      },
      {
        organizationId,
        name: "Art",
        code: "ART",
        description: "Visual arts and creativity",
        isDefault: true,
        isArchived: false,
      },
      {
        organizationId,
        name: "Music",
        code: "MUS",
        description: "Music and performing arts",
        isDefault: true,
        isArchived: false,
      },
      {
        organizationId,
        name: "Computer Science",
        code: "CS",
        description: "Computer science and technology",
        isDefault: true,
        isArchived: false,
      },
      {
        organizationId,
        name: "Foreign Language",
        code: "LANG",
        description: "Foreign language studies",
        isDefault: true,
        isArchived: false,
      },
    ];

    // Check if subjects already exist to avoid duplicates
    const existing = await this.getSubjects(organizationId);
    if (existing.length === 0) {
      await db.insert(subjects).values(defaultSubjects);
    }
  }

  // Academic Log Category operations
  async getAcademicLogCategories(organizationId: string): Promise<AcademicLogCategory[]> {
    const results = await db
      .select()
      .from(academicLogCategories)
      .where(eq(academicLogCategories.organizationId, organizationId));

    // Sort by display order, then name
    return results.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }

  async createAcademicLogCategory(category: InsertAcademicLogCategory): Promise<AcademicLogCategory> {
    const [newCategory] = await db
      .insert(academicLogCategories)
      .values({
        ...category,
        updatedAt: new Date(),
      })
      .returning();
    return newCategory;
  }

  async updateAcademicLogCategory(
    id: string,
    organizationId: string,
    category: Partial<InsertAcademicLogCategory>
  ): Promise<AcademicLogCategory> {
    const [updated] = await db
      .update(academicLogCategories)
      .set({
        ...category,
        updatedAt: new Date(),
      })
      .where(and(eq(academicLogCategories.id, id), eq(academicLogCategories.organizationId, organizationId)))
      .returning();

    if (!updated) {
      throw new Error(`Academic category with id ${id} not found in organization ${organizationId}`);
    }

    return updated;
  }

  async deleteAcademicLogCategory(id: string, organizationId: string): Promise<void> {
    await db
      .delete(academicLogCategories)
      .where(and(eq(academicLogCategories.id, id), eq(academicLogCategories.organizationId, organizationId)));
  }

  async seedDefaultAcademicCategories(organizationId: string): Promise<void> {
    const defaultCategories: InsertAcademicLogCategory[] = [
      {
        organizationId,
        name: "Excellent",
        description: "Outstanding academic performance",
        color: "green",
        displayOrder: 0,
      },
      {
        organizationId,
        name: "Good",
        description: "Strong academic performance",
        color: "blue",
        displayOrder: 1,
      },
      {
        organizationId,
        name: "Satisfactory",
        description: "Meets expectations",
        color: "amber",
        displayOrder: 2,
      },
      {
        organizationId,
        name: "Needs Improvement",
        description: "Requires additional support",
        color: "orange",
        displayOrder: 3,
      },
      {
        organizationId,
        name: "Concern",
        description: "Significant academic concerns",
        color: "red",
        displayOrder: 4,
      },
    ];

    // Check if categories already exist to avoid duplicates
    const existing = await this.getAcademicLogCategories(organizationId);
    if (existing.length === 0) {
      await db.insert(academicLogCategories).values(defaultCategories);
    }
  }

  // Academic Log operations
  async getAcademicLogs(studentId: string, organizationId: string): Promise<AcademicLog[]> {
    return await db
      .select()
      .from(academicLogs)
      .where(
        and(
          eq(academicLogs.studentId, studentId),
          eq(academicLogs.organizationId, organizationId)
        )
      );
  }

  async getAllAcademicLogs(organizationId: string): Promise<any[]> {
    const logs = await db
      .select({
        id: academicLogs.id,
        organizationId: academicLogs.organizationId,
        studentId: academicLogs.studentId,
        subjectId: academicLogs.subjectId,
        categoryId: academicLogs.categoryId,
        assessmentDate: academicLogs.assessmentDate,
        grade: academicLogs.grade,
        score: academicLogs.score,
        notes: academicLogs.notes,
        loggedBy: academicLogs.loggedBy,
        loggedAt: academicLogs.loggedAt,
        student: {
          id: students.id,
          name: students.name,
          email: students.email,
          classId: students.classId,
        },
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        },
        category: {
          id: academicLogCategories.id,
          name: academicLogCategories.name,
          color: academicLogCategories.color,
        },
        class: {
          id: classes.id,
          name: classes.name,
        },
      })
      .from(academicLogs)
      .leftJoin(students, eq(academicLogs.studentId, students.id))
      .leftJoin(subjects, eq(academicLogs.subjectId, subjects.id))
      .leftJoin(academicLogCategories, eq(academicLogs.categoryId, academicLogCategories.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(eq(academicLogs.organizationId, organizationId))
      .orderBy(academicLogs.assessmentDate);

    return logs;
  }

  async getAcademicLog(id: string, organizationId: string): Promise<AcademicLog | undefined> {
    const [log] = await db
      .select()
      .from(academicLogs)
      .where(and(eq(academicLogs.id, id), eq(academicLogs.organizationId, organizationId)));
    return log;
  }

  async createAcademicLog(log: InsertAcademicLog): Promise<AcademicLog> {
    const [newLog] = await db.insert(academicLogs).values(log).returning();
    return newLog;
  }

  async updateAcademicLog(id: string, organizationId: string, log: Partial<InsertAcademicLog>): Promise<AcademicLog> {
    const [updated] = await db
      .update(academicLogs)
      .set(log)
      .where(and(eq(academicLogs.id, id), eq(academicLogs.organizationId, organizationId)))
      .returning();

    if (!updated) {
      throw new Error("Academic log not found");
    }

    return updated;
  }

  async deleteAcademicLog(id: string, organizationId: string): Promise<void> {
    await db
      .delete(academicLogs)
      .where(and(eq(academicLogs.id, id), eq(academicLogs.organizationId, organizationId)));
  }
}

export const storage = new DatabaseStorage();
