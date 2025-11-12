import {
  users,
  organizations,
  organizationUsers,
  students,
  behaviorLogs,
  behaviorLogCategories,
  meetingNotes,
  tasks,
  classes,
  studentResources,
  subjects,
  academicLogCategories,
  academicLogs,
  lists,
  listItems,
  listShares,
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
  type Task,
  type InsertTask,
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
  type List,
  type InsertList,
  type ListItem,
  type InsertListItem,
  type ListShare,
  type InsertListShare,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ne, sql, inArray } from "drizzle-orm";

export interface DashboardStats {
  totalStudents: number;
  totalBehaviorLogs: number;
  pendingTasks: number;
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
  
  // Task operations
  getTasks(studentId: string, organizationId: string): Promise<Task[]>;
  getAllTasks(organizationId: string): Promise<Task[]>;
  getAllTasksWithStudents(organizationId: string): Promise<Array<Task & { student: Student | null }>>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, organizationId: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string, organizationId: string): Promise<void>;
  
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

  // List operations
  getLists(organizationId: string, userId: string): Promise<List[]>; // Returns lists user created or has access to
  getList(id: string, organizationId: string, userId: string): Promise<List | undefined>;
  createList(list: InsertList): Promise<List>;
  updateList(id: string, organizationId: string, userId: string, list: Partial<InsertList>): Promise<List>;
  deleteList(id: string, organizationId: string, userId: string): Promise<void>;

  // List Item operations
  getListItems(listId: string, organizationId: string, userId: string): Promise<ListItem[]>;
  addListItem(item: InsertListItem, userId: string): Promise<ListItem>;
  removeListItem(id: string, listId: string, organizationId: string, userId: string): Promise<void>;

  // List Sharing operations
  getListShares(listId: string, userId: string): Promise<ListShare[]>;
  shareList(listId: string, sharedWithUserId: string, userId: string, organizationId: string): Promise<ListShare>;
  unshareList(listId: string, sharedWithUserId: string, userId: string): Promise<void>;
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
    const tasksData = await db.select().from(tasks).where(eq(tasks.organizationId, organizationId));

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

    // Count tasks that are not Done or Archived
    const pendingTasks = tasksData.filter(task =>
      task.status !== "Done" && task.status !== "Archived"
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
      pendingTasks,
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

  // Task operations
  async getTasks(studentId: string, organizationId: string): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.studentId, studentId), eq(tasks.organizationId, organizationId)));
  }

  async getAllTasks(organizationId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.organizationId, organizationId));
  }

  async getAllTasksWithStudents(organizationId: string): Promise<Array<Task & { student: Student | null }>> {
    const result = await db
      .select({
        task: tasks,
        student: students,
      })
      .from(tasks)
      .leftJoin(
        students,
        and(
          eq(tasks.studentId, students.id),
          eq(students.organizationId, organizationId)
        )
      )
      .where(eq(tasks.organizationId, organizationId))
      .orderBy(tasks.createdAt);

    console.log("[Storage] getAllTasksWithStudents raw result:", JSON.stringify(result, null, 2));

    const mapped = result.map((row) => ({
      ...row.task,
      student: row.student,
    }));

    console.log("[Storage] getAllTasksWithStudents mapped result:", JSON.stringify(mapped, null, 2));

    return mapped;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, organizationId: string, task: Partial<InsertTask>): Promise<Task> {
    console.log(`[DEBUG Storage] updateTask called with:`, {
      id,
      organizationId,
      task,
      taskKeys: Object.keys(task),
    });

    // Filter out undefined values to ensure we only update provided fields
    // This prevents null constraint violations when doing partial updates
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only include fields that are explicitly provided (not undefined)
    if (task.title !== undefined) updateData.title = task.title;
    if (task.description !== undefined) updateData.description = task.description;
    if (task.status !== undefined) updateData.status = task.status;
    if (task.assignee !== undefined) updateData.assignee = task.assignee;
    if (task.dueDate !== undefined) updateData.dueDate = task.dueDate;

    console.log(`[DEBUG Storage] Final updateData to be sent to DB:`, updateData);

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
      .returning();

    if (!updated) {
      throw new Error("Task not found");
    }

    console.log(`[DEBUG Storage] Task updated successfully:`, updated);
    return updated;
  }

  async deleteTask(id: string, organizationId: string): Promise<void> {
    await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)));
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

  // ========================================
  // List operations
  // ========================================

  async getLists(organizationId: string, userId: string): Promise<List[]> {
    // Get lists created by user with user info
    const createdListsData = await db
      .select({
        list: lists,
        user: users,
      })
      .from(lists)
      .leftJoin(users, eq(lists.createdBy, users.id))
      .where(and(eq(lists.organizationId, organizationId), eq(lists.createdBy, userId)));

    const createdLists = createdListsData.map((row) => ({
      ...row.list,
      createdByUser: row.user ? {
        id: row.user.id,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
        email: row.user.email,
      } : undefined,
    }));

    // Get shared lists with user info
    const sharedListsData = await db
      .select({
        list: lists,
        user: users,
      })
      .from(listShares)
      .innerJoin(lists, eq(listShares.listId, lists.id))
      .leftJoin(users, eq(lists.createdBy, users.id))
      .where(and(eq(lists.organizationId, organizationId), eq(listShares.sharedWithUserId, userId)));

    const sharedLists = sharedListsData.map((row) => ({
      ...row.list,
      createdByUser: row.user ? {
        id: row.user.id,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
        email: row.user.email,
      } : undefined,
    }));

    // Combine and deduplicate
    const allLists = [...createdLists, ...sharedLists];
    const uniqueLists = allLists.filter(
      (list, index, self) => self.findIndex((l) => l.id === list.id) === index
    );

    return uniqueLists;
  }

  async getList(id: string, organizationId: string, userId: string): Promise<List | undefined> {
    const [listData] = await db
      .select({
        list: lists,
        user: users,
      })
      .from(lists)
      .leftJoin(users, eq(lists.createdBy, users.id))
      .where(and(eq(lists.id, id), eq(lists.organizationId, organizationId)));

    if (!listData) return undefined;

    const list: List = {
      ...listData.list,
      createdByUser: listData.user ? {
        id: listData.user.id,
        firstName: listData.user.firstName,
        lastName: listData.user.lastName,
        email: listData.user.email,
      } : undefined,
    };

    // Check if user has access (creator or shared with)
    const isCreator = list.createdBy === userId;
    if (isCreator) return list;

    const [shared] = await db
      .select()
      .from(listShares)
      .where(and(eq(listShares.listId, id), eq(listShares.sharedWithUserId, userId)));

    return shared ? list : undefined;
  }

  async createList(listData: InsertList): Promise<List> {
    const [list] = await db.insert(lists).values(listData).returning();
    return list;
  }

  async updateList(
    id: string,
    organizationId: string,
    userId: string,
    listData: Partial<InsertList>
  ): Promise<List> {
    // Only creator can update
    const list = await this.getList(id, organizationId, userId);
    if (!list || list.createdBy !== userId) {
      throw new Error("Only list creator can update");
    }

    const [updated] = await db
      .update(lists)
      .set({ ...listData, updatedAt: new Date() })
      .where(and(eq(lists.id, id), eq(lists.organizationId, organizationId)))
      .returning();

    return updated;
  }

  async deleteList(id: string, organizationId: string, userId: string): Promise<void> {
    // Only creator can delete
    const list = await this.getList(id, organizationId, userId);
    if (!list || list.createdBy !== userId) {
      throw new Error("Only list creator can delete");
    }

    await db
      .delete(lists)
      .where(and(eq(lists.id, id), eq(lists.organizationId, organizationId)));
  }

  // ========================================
  // List Item operations
  // ========================================

  async getListItems(listId: string, organizationId: string, userId: string): Promise<ListItem[]> {
    // Verify access to list
    const list = await this.getList(listId, organizationId, userId);
    if (!list) {
      throw new Error("List not found or no access");
    }

    // Get items with user info for addedBy
    const itemsData = await db
      .select({
        item: listItems,
        addedByUser: users,
      })
      .from(listItems)
      .leftJoin(users, eq(listItems.addedBy, users.id))
      .where(eq(listItems.listId, listId));

    // Map items and add user info
    const itemsWithUsers: ListItem[] = itemsData.map((row) => ({
      ...row.item,
      addedByUser: row.addedByUser ? {
        id: row.addedByUser.id,
        firstName: row.addedByUser.firstName,
        lastName: row.addedByUser.lastName,
        email: row.addedByUser.email,
      } : undefined,
    }));

    // Now populate related data based on list type
    if (list.type === "students") {
      // Get all student IDs from items
      const studentIds = itemsWithUsers
        .map((item) => item.studentId)
        .filter((id): id is string => id !== null);

      console.log("[getListItems] List type: students, studentIds:", studentIds);

      if (studentIds.length > 0) {
        const studentsData = await db
          .select()
          .from(students)
          .where(inArray(students.id, studentIds));

        console.log("[getListItems] Fetched students count:", studentsData.length);
        console.log("[getListItems] Students data:", studentsData);

        // Map students to items - always return, even if no students found
        const mappedItems = itemsWithUsers.map((item) => ({
          ...item,
          student: studentsData.find((s) => s.id === item.studentId),
        }));

        console.log("[getListItems] Mapped items:", JSON.stringify(mappedItems, null, 2));

        return mappedItems;
      }

      // No student IDs, return items as-is
      console.log("[getListItems] No student IDs found, returning items as-is");
      return itemsWithUsers;
    } else if (list.type === "behavior_logs") {
      // Get all behavior log IDs from items
      const behaviorLogIds = itemsWithUsers
        .map((item) => item.behaviorLogId)
        .filter((id): id is string => id !== null);

      if (behaviorLogIds.length > 0) {
        const behaviorLogsData = await db
          .select({
            log: behaviorLogs,
            student: students,
            category: behaviorLogCategories,
          })
          .from(behaviorLogs)
          .leftJoin(students, eq(behaviorLogs.studentId, students.id))
          .leftJoin(behaviorLogCategories, eq(behaviorLogs.categoryId, behaviorLogCategories.id))
          .where(inArray(behaviorLogs.id, behaviorLogIds));

        // Map behavior logs to items
        const mappedItems = itemsWithUsers.map((item) => {
          const logData = behaviorLogsData.find((l) => l.log.id === item.behaviorLogId);
          return {
            ...item,
            behaviorLog: logData ? {
              ...logData.log,
              student: logData.student ? { name: logData.student.name } : undefined,
              category: logData.category ? {
                name: logData.category.name,
                color: logData.category.color,
              } : undefined,
            } : undefined,
          };
        });

        return mappedItems;
      }

      // No behavior log IDs, return items as-is
      return itemsWithUsers;
    } else if (list.type === "academic_logs") {
      // Get all academic log IDs from items
      const academicLogIds = itemsWithUsers
        .map((item) => item.academicLogId)
        .filter((id): id is string => id !== null);

      if (academicLogIds.length > 0) {
        const academicLogsData = await db
          .select({
            log: academicLogs,
            student: students,
            subject: subjects,
            category: academicLogCategories,
          })
          .from(academicLogs)
          .leftJoin(students, eq(academicLogs.studentId, students.id))
          .leftJoin(subjects, eq(academicLogs.subjectId, subjects.id))
          .leftJoin(academicLogCategories, eq(academicLogs.categoryId, academicLogCategories.id))
          .where(inArray(academicLogs.id, academicLogIds));

        // Map academic logs to items
        const mappedItems = itemsWithUsers.map((item) => {
          const logData = academicLogsData.find((l) => l.log.id === item.academicLogId);
          return {
            ...item,
            academicLog: logData ? {
              ...logData.log,
              student: logData.student ? { name: logData.student.name } : undefined,
              subject: logData.subject ? { name: logData.subject.name } : undefined,
              category: logData.category ? {
                name: logData.category.name,
                color: logData.category.color,
              } : undefined,
            } : undefined,
          };
        });

        return mappedItems;
      }

      // No academic log IDs, return items as-is
      return itemsWithUsers;
    }

    // Fallback: return items with user info
    return itemsWithUsers;
  }

  async addListItem(item: InsertListItem, userId: string): Promise<ListItem> {
    // Note: Duplicate prevention is handled by unique constraints in database
    const [newItem] = await db.insert(listItems).values(item).returning();
    return newItem;
  }

  async removeListItem(
    id: string,
    listId: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    // Verify access to list
    const list = await this.getList(listId, organizationId, userId);
    if (!list) {
      throw new Error("List not found or no access");
    }

    await db.delete(listItems).where(and(eq(listItems.id, id), eq(listItems.listId, listId)));
  }

  // ========================================
  // List Sharing operations
  // ========================================

  async getListShares(listId: string, userId: string): Promise<ListShare[]> {
    // Only creator can view shares
    const [list] = await db.select().from(lists).where(eq(lists.id, listId));

    if (!list || list.createdBy !== userId) {
      throw new Error("Only list creator can view shares");
    }

    const shares = await db.select().from(listShares).where(eq(listShares.listId, listId));

    return shares;
  }

  async shareList(
    listId: string,
    sharedWithUserId: string,
    userId: string,
    organizationId: string
  ): Promise<ListShare> {
    // Only creator can share
    const list = await this.getList(listId, organizationId, userId);
    if (!list || list.createdBy !== userId) {
      throw new Error("Only list creator can share");
    }

    const [share] = await db
      .insert(listShares)
      .values({
        listId,
        sharedWithUserId,
        sharedBy: userId,
      })
      .returning();

    return share;
  }

  async unshareList(listId: string, sharedWithUserId: string, userId: string): Promise<void> {
    // Only creator can unshare
    const [list] = await db.select().from(lists).where(eq(lists.id, listId));

    if (!list || list.createdBy !== userId) {
      throw new Error("Only list creator can unshare");
    }

    await db
      .delete(listShares)
      .where(and(eq(listShares.listId, listId), eq(listShares.sharedWithUserId, sharedWithUserId)));
  }
}

export const storage = new DatabaseStorage();
