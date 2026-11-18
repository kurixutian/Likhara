// ============================================================================
// LEGACY MIGRATION — single-workspace localStorage → multi-project IndexedDB
// ============================================================================
//
// Handles both historical storage keys:
//   - 'likhara_studio_v1_project'  (single-project Likhara envelope)
//   - 'canvix_studio_v4_workspace' (legacy Canvix workspace / raw tree)
//
// Rules:
//   - Original storage values are never modified or deleted.
//   - Migration is idempotent: a success marker + collision-safe ids prevent
//     duplicate projects across repeated launches.
//   - If both keys hold valid but different workspaces, BOTH are migrated as
//     separate projects and the conflict is reported for review.
//   - Any failure preserves the original data and is surfaced as recoverable.

import {
  LIKHARA_PROJECT_STORAGE_KEY,
  LEGACY_CANVIX_STORAGE_KEY,
  normalizeNodeSchema,
  validateUINodeTree,
} from '../core';
import type { LikharaProject, UINode } from '../core';
import { listProjects, getProject, saveProjectRecord } from './storage';

export const MIGRATION_MARKER_KEY = 'likhara_legacy_migration_v1_done';

export type MigrationOutcome =
  | { status: 'done'; imported: number; conflict: boolean }
  | { status: 'failed'; error: string };

interface LegacyCandidate {
  source: 'likhara' | 'canvix';
  root: UINode;
  /** Existing envelope metadata to preserve where valid. */
  id?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Validates a root candidate; returns the validated tree or null. */
function validatedRoot(candidate: unknown): UINode | null {
  const check = validateUINodeTree(candidate);
  return check.valid && check.root ? check.root : null;
}

/**
 * Builds a LikharaProject from the single-workspace envelope stored under
 * `likhara_studio_v1_project`, reusing the original envelope metadata.
 */
function fromLikharaEnvelope(raw: string): LegacyCandidate | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;
    const root = validatedRoot(parsed.root);
    if (!root) return null;
    return {
      source: 'likhara',
      root,
      id: typeof parsed.id === 'string' && parsed.id.trim() ? parsed.id : undefined,
      name:
        typeof parsed.name === 'string' && parsed.name.trim()
          ? parsed.name
          : undefined,
      createdAt:
        typeof parsed.createdAt === 'string' ? parsed.createdAt : undefined,
      updatedAt:
        typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Builds a candidate from the legacy Canvix workspace, reusing the existing
 * `normalizeNodeSchema` migration (layout/widthMode/extraClassName → canonical).
 */
function fromCanvixWorkspace(raw: string): LegacyCandidate | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const candidateRoot =
      parsed && typeof parsed === 'object' && (parsed as { root?: unknown }).root
        ? (parsed as { root: unknown }).root
        : parsed;
    const normalized = normalizeNodeSchema(candidateRoot);
    if (!normalized) return null;
    normalized.id = 'root';
    const check = validatedRoot(normalized);
    if (!check) return null;
    return {
      source: 'canvix',
      root: check,
      name:
        parsed && typeof parsed === 'object'
          ? typeof (parsed as { name?: unknown }).name === 'string'
            ? ((parsed as { name: string }).name || undefined)
            : undefined
          : undefined,
    };
  } catch {
    return null;
  }
}

function toProject(
  candidate: LegacyCandidate,
  id: string,
  now: string
): LikharaProject {
  return {
    schemaVersion: 1,
    id,
    name: candidate.name || (candidate.source === 'canvix'
      ? 'Migrated Canvix Project'
      : 'Migrated Likhara Project'),
    createdAt: candidate.createdAt || now,
    updatedAt: candidate.updatedAt || now,
    viewport: { mode: 'desktop', zoom: 100, background: '#09090b' },
    root: candidate.root,
  };
}

function collisionFreeId(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** Persists a candidate, reads it back and verifies the stored tree. */
async function persistAndVerify(
  candidate: LegacyCandidate,
  id: string,
  taken: Set<string>
): Promise<void> {
  const now = new Date().toISOString();
  const project = toProject(candidate, id, now);
  const save = await saveProjectRecord(project);
  if (!save.ok) throw new Error(`Migration save failed: ${save.error}`);

  const readBack = await getProject(project.id);
  if (
    !readBack ||
    JSON.stringify(readBack.root) !== JSON.stringify(project.root) ||
    readBack.name !== project.name
  ) {
    throw new Error(
      'Migration verification failed: saved project did not read back intact.'
    );
  }
  taken.add(project.id);
}

/**
 * Runs the one-time legacy migration. Safe to call on every launch.
 * Legacy localStorage keys are intentionally preserved (read-only).
 */
export async function runLegacyMigration(): Promise<MigrationOutcome> {
  try {
    if (window.localStorage.getItem(MIGRATION_MARKER_KEY) === 'done') {
      return { status: 'done', imported: 0, conflict: false };
    }

    const likharaRaw = readRaw(LIKHARA_PROJECT_STORAGE_KEY);
    const canvixRaw = readRaw(LEGACY_CANVIX_STORAGE_KEY);
    const likharaCandidate = likharaRaw ? fromLikharaEnvelope(likharaRaw) : null;
    const canvixCandidate = canvixRaw ? fromCanvixWorkspace(canvixRaw) : null;

    if (!likharaCandidate && !canvixCandidate) {
      window.localStorage.setItem(MIGRATION_MARKER_KEY, 'done');
      return { status: 'done', imported: 0, conflict: false };
    }

    const existing = await listProjects();
    const taken = new Set(existing.map((p) => p.id));

    const conflict =
      !!likharaCandidate &&
      !!canvixCandidate &&
      JSON.stringify(likharaCandidate.root) !==
        JSON.stringify(canvixCandidate.root);

    let imported = 0;
    if (likharaCandidate) {
      const id = collisionFreeId(
        likharaCandidate.id || 'likhara-main',
        taken
      );
      await persistAndVerify(likharaCandidate, id, taken);
      imported += 1;
    }
    if (canvixCandidate) {
      const id = collisionFreeId('likhara-migrated-v1', taken);
      await persistAndVerify(canvixCandidate, id, taken);
      imported += 1;
    }

    // Mark complete only after every candidate persisted and verified.
    window.localStorage.setItem(MIGRATION_MARKER_KEY, 'done');
    return { status: 'done', imported, conflict };
  } catch (err) {
    // Original storage values are untouched; the marker stays unset so the
    // next launch retries migration after the user resolves the problem.
    return {
      status: 'failed',
      error:
        err instanceof Error ? err.message : 'Unknown migration failure.',
    };
  }
}
