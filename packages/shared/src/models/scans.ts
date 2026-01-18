/**
 * SCANS MODEL
 * 
 * Shared types for fridge scan operations.
 * Used by web and mobile apps.
 * 
 * CANONICAL SCHEMA:
 * - scans/{uid}/runs/{scanId} = ScanRun
 */

import type { FirestoreTimestamp } from './inventory.js';

/**
 * Document: scans/{uid}/runs/{scanId}
 * Tracks the lifecycle of each scan operation
 */
export interface ScanRun {
  createdAt: Date | FirestoreTimestamp;
  imagePath: string; // Storage path or URL
  status: 'uploaded' | 'processing' | 'done' | 'failed';
  extractedCount?: number; // Number of items detected
  error?: string;
  modelVersion?: string; // AI model used (e.g., "gpt-4o-mini")
}

/**
 * @deprecated Legacy type for old schema migration
 */
export interface ScanResult {
  scanId: string;
  items: Array<{
    name: string;
    confidence: number;
    category?: string;
  }>;
  photoUrl: string;
  scannedAt: Date | FirestoreTimestamp;
}
