import type { BehaviorLogCategory, Class } from "@shared/schema";

// Extended type for BehaviorLog with joined data (as returned by API)
export interface BehaviorLogWithJoins {
  id: string;
  organizationId: string;
  studentId: string;
  categoryId: string;
  incidentDate: Date;
  notes: string;
  strategies: string | null;
  loggedBy: string;
  loggedAt: Date | null;
  student?: {
    id: string;
    name: string;
    email: string;
    classId: string | null;
  };
  category?: {
    id: string;
    name: string;
    color: string | null;
  };
  class?: {
    id: string;
    name: string;
  } | null;
}

// Mock categories (matching default seeded categories)
export const mockCategories: BehaviorLogCategory[] = [
  {
    id: "cat-1",
    organizationId: "org-1",
    name: "Positive",
    description: "Positive behavior recognition",
    color: "green",
    displayOrder: 0,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "cat-2",
    organizationId: "org-1",
    name: "Neutral",
    description: "Neutral observations",
    color: "blue",
    displayOrder: 1,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "cat-3",
    organizationId: "org-1",
    name: "Concern",
    description: "Behavior concerns",
    color: "amber",
    displayOrder: 2,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "cat-4",
    organizationId: "org-1",
    name: "Serious",
    description: "Serious incidents",
    color: "red",
    displayOrder: 3,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Mock classes
export const mockClasses: Class[] = [
  {
    id: "class-1",
    organizationId: "org-1",
    name: "Grade 5A",
    description: null,
    isArchived: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "class-2",
    organizationId: "org-1",
    name: "Grade 5B",
    description: null,
    isArchived: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "class-3",
    organizationId: "org-1",
    name: "Grade 6A",
    description: null,
    isArchived: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "class-4",
    organizationId: "org-1",
    name: "Grade 6B",
    description: null,
    isArchived: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "class-5",
    organizationId: "org-1",
    name: "Grade 7A",
    description: null,
    isArchived: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Helper function to generate random date in the last 30 days
const randomDateInLast30Days = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

// Helper function to get random item from array
const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Mock behavior logs (100+ entries for realistic data)
export const mockBehaviorLogs: BehaviorLogWithJoins[] = [
  // Positive behaviors (40%)
  ...Array.from({ length: 40 }, (_, i) => ({
    id: `log-positive-${i}`,
    organizationId: "org-1",
    studentId: `student-${i % 20}`,
    categoryId: "cat-1", // Positive
    incidentDate: randomDateInLast30Days(),
    notes: "Excellent participation in class discussion",
    strategies: null,
    loggedBy: "Teacher Smith",
    loggedAt: randomDateInLast30Days(),
    student: {
      id: `student-${i % 20}`,
      name: `Student ${i % 20}`,
      email: `student${i % 20}@school.com`,
      classId: randomItem(mockClasses).id,
    },
    category: mockCategories[0],
    class: randomItem(mockClasses),
  })),

  // Neutral behaviors (30%)
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `log-neutral-${i}`,
    organizationId: "org-1",
    studentId: `student-${i % 20}`,
    categoryId: "cat-2", // Neutral
    incidentDate: randomDateInLast30Days(),
    notes: "Regular classroom observation",
    strategies: null,
    loggedBy: "Teacher Jones",
    loggedAt: randomDateInLast30Days(),
    student: {
      id: `student-${i % 20}`,
      name: `Student ${i % 20}`,
      email: `student${i % 20}@school.com`,
      classId: randomItem(mockClasses).id,
    },
    category: mockCategories[1],
    class: randomItem(mockClasses),
  })),

  // Concerns (20%)
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `log-concern-${i}`,
    organizationId: "org-1",
    studentId: `student-${i % 20}`,
    categoryId: "cat-3", // Concern
    incidentDate: randomDateInLast30Days(),
    notes: "Talking during quiet work time",
    strategies: "Reminder of classroom expectations",
    loggedBy: "Teacher Brown",
    loggedAt: randomDateInLast30Days(),
    student: {
      id: `student-${i % 20}`,
      name: `Student ${i % 20}`,
      email: `student${i % 20}@school.com`,
      classId: randomItem(mockClasses).id,
    },
    category: mockCategories[2],
    class: randomItem(mockClasses),
  })),

  // Serious incidents (10%)
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `log-serious-${i}`,
    organizationId: "org-1",
    studentId: `student-${i % 20}`,
    categoryId: "cat-4", // Serious
    incidentDate: randomDateInLast30Days(),
    notes: "Disruptive behavior requiring intervention",
    strategies: "Parent contact and behavior plan",
    loggedBy: "Principal Davis",
    loggedAt: randomDateInLast30Days(),
    student: {
      id: `student-${i % 20}`,
      name: `Student ${i % 20}`,
      email: `student${i % 20}@school.com`,
      classId: randomItem(mockClasses).id,
    },
    category: mockCategories[3],
    class: randomItem(mockClasses),
  })),
];
