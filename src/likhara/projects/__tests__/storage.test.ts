import { describe, it, expect } from 'vitest';
import {
  listProjects,
  getProject,
  saveProjectRecord,
  deleteProjectRecord,
  setActiveProjectId,
  getActiveProjectId,
  ACTIVE_PROJECT_PREF_KEY,
} from '../storage';
import { createProject } from '../projectOps';

describe('project store (IndexedDB)', () => {
  it('saves and retrieves projects scoped by id', async () => {
    const a = createProject();
    a.name = 'Project A';
    const b = createProject();
    b.name = 'Project B';

    expect(await saveProjectRecord(a)).toEqual({ ok: true });
    expect(await saveProjectRecord(b)).toEqual({ ok: true });

    const loadedA = await getProject(a.id);
    expect(loadedA?.name).toBe('Project A');
    const loadedB = await getProject(b.id);
    expect(loadedB?.name).toBe('Project B');
    expect(loadedA?.id).not.toBe(loadedB?.id);
  });

  it('keeps two projects fully independent', async () => {
    const a = createProject();
    const b = createProject();
    await saveProjectRecord(a);
    await saveProjectRecord(b);

    // Re-saving A with a mutated tree must not touch B.
    const mutated = { ...a, root: structuredClone(a.root) };
    mutated.root.children = [];
    await saveProjectRecord(mutated);

    const reloadedA = await getProject(a.id);
    const reloadedB = await getProject(b.id);
    expect(reloadedA?.root.children).toHaveLength(0);
    expect(reloadedB?.root.children.length).toBeGreaterThan(0);
    expect(await listProjects()).toHaveLength(2);
  });

  it('deletes only the intended project', async () => {
    const a = createProject();
    const b = createProject();
    await saveProjectRecord(a);
    await saveProjectRecord(b);

    expect(await deleteProjectRecord(a.id)).toEqual({ ok: true });
    expect(await getProject(a.id)).toBeNull();
    expect((await getProject(b.id))?.id).toBe(b.id);
    expect(await listProjects()).toHaveLength(1);
  });

  it('lists projects ordered by most recently updated', async () => {
    const older = createProject();
    older.updatedAt = '2026-01-01T00:00:00.000Z';
    const newer = createProject();
    newer.updatedAt = '2026-02-01T00:00:00.000Z';
    await saveProjectRecord(older);
    await saveProjectRecord(newer);
    const all = await listProjects();
    expect(all[0].id).toBe(newer.id);
    expect(all[1].id).toBe(older.id);
  });

  it('reports quota/write failures as a visible error, not a throw', async () => {
    const realIdb = globalThis.indexedDB;
    // @ts-expect-error intentionally breaking the environment
    globalThis.indexedDB = undefined;
    const result = await saveProjectRecord(createProject());
    globalThis.indexedDB = realIdb;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.toLowerCase()).toContain('indexeddb');
    }
  });
});

describe('active project preference (localStorage)', () => {
  it('stores and clears the active project reference', () => {
    setActiveProjectId('proj-42');
    expect(getActiveProjectId()).toBe('proj-42');
    setActiveProjectId(null);
    expect(getActiveProjectId()).toBeNull();
  });

  it('survives storage failures silently (non-critical pref)', () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error('blocked');
    };
    expect(() => setActiveProjectId('x')).not.toThrow();
    window.localStorage.setItem = original;
    expect(window.localStorage.getItem(ACTIVE_PROJECT_PREF_KEY)).toBeNull();
  });
});
