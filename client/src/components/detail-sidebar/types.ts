/**
 * Generic detail entity type.
 * Use this as a base type for different entity details.
 */
export interface DetailEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Common metadata fields found across entities.
 */
export interface DetailMetadata {
  loggedBy?: string;
  loggedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Category information (shared across behavior logs, academic logs, etc.)
 */
export interface DetailCategory {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
}
