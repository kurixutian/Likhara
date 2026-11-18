import { describe, it, expect } from 'vitest';
import {
  createProject,
  renameProject,
  duplicateProject,
  parseProjectDocument,
} from '../projectOps';
import { createDefaultStyle } from '../../core';
import type { LikharaProject, UINode } from '../../core';

function leafTree(): UINode {
  return {
    id: 'root',
    name: 'Root Workspace',
    tag: 'div',
    isContainer: true,
    style: createDefaultStyle(),
    children: [
      {
        id: 'child-1',
        name: 'Title',
        tag: 'h1',
        isContainer: false,
        text: 'Hello',
        style: createDefaultStyle(),
        children: [],
      },
    ],
  };
}

function projectWithTree(root: UINode): LikharaProject {
  return {
    schemaVersion: 1,
    id: 'proj-original',
    name: 'Original',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    viewport: { mode: 'desktop', zoom: 100, background: '#09090b' },
    root,
  };
}

describe('project lifecycle operations', () => {
  it('creates a valid project with unique id and starter tree', () => {
    const a = createProject();
    const b = createProject();
    expect(a.id).not.toBe(b.id);
    expect(a.schemaVersion).toBe(1);
    expect(a.name).toBe('Untitled Project');
    expect(a.root.id).toBe('root');
    expect(a.root.children.length).toBeGreaterThan(0);
    expect(new Date(a.createdAt).toString()).not.toBe('Invalid Date');
  });

  it('renames without touching id or tree and refreshes updatedAt', () => {
    const project = projectWithTree(leafTree());
    const renamed = renameProject(project, '  Renamed  ');
    expect(renamed.id).toBe('proj-original');
    expect(renamed.name).toBe('Renamed');
    expect(renamed.root).toBe(project.root);
    expect(new Date(renamed.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(project.updatedAt).getTime()
    );
  });

  it('duplicates into an independent copy with a new id', () => {
    const project = projectWithTree(leafTree());
    const copy = duplicateProject(project);
    expect(copy.id).not.toBe(project.id);
    expect(copy.name).toBe('Original Copy');
    expect(copy.root).toEqual(project.root);
    expect(copy.root).not.toBe(project.root);
    // Mutating the copy must never affect the original.
    copy.root.children[0].text = 'Mutated';
    expect(project.root.children[0].text).toBe('Hello');
  });

  it('imports a valid project document', () => {
    const doc = projectWithTree(leafTree());
    const result = parseProjectDocument(JSON.stringify(doc), []);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.id).toBe('proj-original');
    expect(result.project.root.children[0].text).toBe('Hello');
    expect(result.renamedDueToCollision).toBe(false);
  });

  it('re-ids on id collision instead of overwriting', () => {
    const doc = projectWithTree(leafTree());
    const result = parseProjectDocument(JSON.stringify(doc), ['proj-original']);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.id).not.toBe('proj-original');
    expect(result.renamedDueToCollision).toBe(true);
  });

  it('rejects malformed, unsupported and tree-invalid documents', () => {
    const badJson = parseProjectDocument('{not json', []);
    expect(badJson.ok).toBe(false);

    const badSchema = parseProjectDocument(
      JSON.stringify({ ...projectWithTree(leafTree()), schemaVersion: 99 }),
      []
    );
    expect(badSchema.ok).toBe(false);

    const badTree = parseProjectDocument(
      JSON.stringify({
        ...projectWithTree(leafTree()),
        root: { id: 'root', tag: 'iframe', children: [] },
      }),
      []
    );
    expect(badTree.ok).toBe(false);

    const empty = parseProjectDocument('   ', []);
    expect(empty.ok).toBe(false);
  });
});
