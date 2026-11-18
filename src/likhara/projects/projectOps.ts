// ============================================================================
// PROJECT LIFECYCLE — pure operations on LikharaProject documents
// ============================================================================

import {
  DEFAULT_LIKHARA_STARTER_TREE,
  validateUINodeTree,
} from '../core';
import type { LikharaProject, UINode } from '../core';

export const LIKHARA_SCHEMA_VERSION = 1;

export function createProjectId(): string {
  return `proj-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

function freshStarterTree(): UINode {
  // Clone the shared starter tree so every project owns independent data.
  return structuredClone(DEFAULT_LIKHARA_STARTER_TREE);
}

export function createProject(name = 'Untitled Project'): LikharaProject {
  const now = new Date().toISOString();
  return {
    schemaVersion: LIKHARA_SCHEMA_VERSION,
    id: createProjectId(),
    name: name.trim() || 'Untitled Project',
    createdAt: now,
    updatedAt: now,
    viewport: { mode: 'desktop', zoom: 100, background: '#09090b' },
    root: freshStarterTree(),
  };
}

export function renameProject(
  project: LikharaProject,
  name: string
): LikharaProject {
  return {
    ...project,
    name: name.trim() || project.name,
    updatedAt: new Date().toISOString(),
  };
}

export function duplicateProject(project: LikharaProject): LikharaProject {
  const now = new Date().toISOString();
  return {
    ...project,
    id: createProjectId(),
    name: `${project.name} Copy`,
    createdAt: now,
    updatedAt: now,
    root: structuredClone(project.root),
  };
}

export type ProjectImportResult =
  | { ok: true; project: LikharaProject; renamedDueToCollision: boolean }
  | { ok: false; errors: string[] };

/**
 * Validates a full LikharaProject document (JSON string) for the project-home
 * import action. Rejects malformed or incompatible files without touching
 * existing data. Colliding ids are re-generated, never silently overwritten.
 */
export function parseProjectDocument(
  rawJson: string,
  existingIds: readonly string[]
): ProjectImportResult {
  if (!rawJson || !rawJson.trim()) {
    return { ok: false, errors: ['Import file is empty.'] };
  }
  if (rawJson.length > 5_000_000) {
    return { ok: false, errors: ['Import file exceeds the 5MB limit.'] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return {
      ok: false,
      errors: [
        `Invalid JSON: ${err instanceof Error ? err.message : 'parse failure'}`,
      ],
    };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, errors: ['Import must be a Likhara project object.'] };
  }

  const obj = parsed as Record<string, unknown>;
  const errors: string[] = [];

  if (obj.schemaVersion !== LIKHARA_SCHEMA_VERSION) {
    errors.push(
      `Unsupported schemaVersion '${String(obj.schemaVersion)}'. Expected ${LIKHARA_SCHEMA_VERSION}.`
    );
  }
  if (typeof obj.id !== 'string' || !obj.id.trim()) {
    errors.push("Project document is missing a valid 'id'.");
  }
  if (!('root' in obj)) {
    errors.push("Project document is missing a 'root' design tree.");
  } else {
    const treeCheck = validateUINodeTree(obj.root);
    if (!treeCheck.valid || !treeCheck.root) {
      errors.push(...treeCheck.errors.slice(0, 10));
      if (treeCheck.errors.length > 10)
        errors.push(`…and ${treeCheck.errors.length - 10} more issues.`);
    }
  }
  if (errors.length > 0) return { ok: false, errors };

  const root = validateUINodeTree(obj.root).root as UINode;
  const now = new Date().toISOString();
  const collision = existingIds.includes(obj.id as string);
  const project: LikharaProject = {
    schemaVersion: LIKHARA_SCHEMA_VERSION,
    id: collision ? createProjectId() : (obj.id as string),
    name:
      typeof obj.name === 'string' && obj.name.trim()
        ? obj.name.trim()
        : 'Imported Project',
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : now,
    updatedAt: now,
    viewport: {
      mode:
        obj.viewport &&
        typeof obj.viewport === 'object' &&
        (obj.viewport as { mode?: unknown }).mode === 'tablet'
          ? 'tablet'
          : (obj.viewport as { mode?: unknown })?.mode === 'mobile'
          ? 'mobile'
          : 'desktop',
      zoom:
        obj.viewport &&
        typeof obj.viewport === 'object' &&
        typeof (obj.viewport as { zoom?: unknown }).zoom === 'number'
          ? (obj.viewport as { zoom: number }).zoom
          : 100,
      background:
        obj.viewport &&
        typeof obj.viewport === 'object' &&
        typeof (obj.viewport as { background?: unknown }).background ===
          'string'
          ? (obj.viewport as { background: string }).background
          : '#09090b',
    },
    root,
  };

  return { ok: true, project, renamedDueToCollision: collision };
}
