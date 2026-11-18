import { describe, it, expect, beforeEach } from 'vitest';
import { runLegacyMigration, MIGRATION_MARKER_KEY } from '../migration';
import { listProjects, getProject } from '../storage';
import {
  LIKHARA_PROJECT_STORAGE_KEY,
  LEGACY_CANVIX_STORAGE_KEY,
  createDefaultStyle,
} from '../../core';
import type { UINode } from '../../core';

/** Realistic root tree in the current source format. */
function tree(label: string): UINode {
  return {
    id: 'root',
    name: 'Root Workspace',
    tag: 'div',
    isContainer: true,
    style: createDefaultStyle({ bgColor: '#09090b', bgAlpha: 100 }),
    children: [
      {
        id: 'likhara-heading',
        name: 'Hero Title',
        tag: 'h1',
        isContainer: false,
        text: label,
        style: createDefaultStyle(),
        children: [],
      },
    ],
  };
}

function seedLikhara(label: string): void {
  window.localStorage.setItem(
    LIKHARA_PROJECT_STORAGE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      id: 'likhara-main',
      name: 'My Likhara Workspace',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      root: tree(label),
    })
  );
}

/**
 * Legacy Canvix format: raw tree using retired tokens
 * (layout, widthMode, extraClassName, justify) that normalizeNodeSchema maps.
 */
function seedCanvix(label: string): void {
  window.localStorage.setItem(
    LEGACY_CANVIX_STORAGE_KEY,
    JSON.stringify({
      name: 'Canvix Workspace',
      tag: 'div',
      isContainer: true,
      extraClassName: 'legacy-shell',
      style: { layout: 'flex-row', widthMode: 'fit' },
      children: [
        {
          tag: 'h1',
          text: label,
          style: { justify: 'center' },
          children: [],
        },
      ],
    })
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('legacy migration', () => {
  it('does nothing on a fresh install and marks migration done', async () => {
    const outcome = await runLegacyMigration();
    expect(outcome.status).toBe('done');
    expect(outcome).toMatchObject({ imported: 0, conflict: false });
    expect(await listProjects()).toHaveLength(0);
    expect(window.localStorage.getItem(MIGRATION_MARKER_KEY)).toBe('done');
  });

  it('migrates the likhara_studio_v1_project envelope preserving metadata', async () => {
    seedLikhara('Likhara content');
    const outcome = await runLegacyMigration();
    expect(outcome).toMatchObject({ status: 'done', imported: 1 });

    const projects = await listProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('likhara-main');
    expect(projects[0].name).toBe('My Likhara Workspace');
    expect(projects[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
    const heading = projects[0].root.children[0];
    expect(heading.text).toBe('Likhara content');

    // Original storage value must be preserved untouched.
    expect(
      window.localStorage.getItem(LIKHARA_PROJECT_STORAGE_KEY)
    ).toBeTruthy();
  });

  it('migrates the canvix_studio_v4_workspace using the legacy normalizer', async () => {
    seedCanvix('Canvix content');
    const outcome = await runLegacyMigration();
    expect(outcome).toMatchObject({ status: 'done', imported: 1 });

    const projects = await listProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('likhara-migrated-v1');
    // Legacy tokens converted: layout flex-row → row direction, fit width.
    expect(projects[0].root.style.flexDirection).toBe('row');
    expect(projects[0].root.style.width).toBe('fit-content');
    expect(projects[0].root.style.customClass).toBe('legacy-shell');
    expect(projects[0].root.children[0].text).toBe('Canvix content');
    expect(
      window.localStorage.getItem(LEGACY_CANVIX_STORAGE_KEY)
    ).toBeTruthy();
  });

  it('preserves both conflicting workspaces as separate projects', async () => {
    seedLikhara('Likhara version');
    seedCanvix('Canvix version');
    const outcome = await runLegacyMigration();
    expect(outcome).toMatchObject({ status: 'done', imported: 2, conflict: true });

    const projects = await listProjects();
    expect(projects).toHaveLength(2);
    const texts = projects.map(
      (p) => (p.root.children[0] as { text?: string }).text
    );
    expect(texts).toContain('Likhara version');
    expect(texts).toContain('Canvix version');
  });

  it('is idempotent across repeated launches', async () => {
    seedLikhara('Stable content');
    await runLegacyMigration();
    const outcome = await runLegacyMigration();
    expect(outcome).toMatchObject({ status: 'done', imported: 0 });
    expect(await listProjects()).toHaveLength(1);
  });

  it('resolves an id collision by assigning a fresh id, never overwriting', async () => {
    seedLikhara('Envelope content');
    await runLegacyMigration();
    // Simulate a second device's data appearing under the same id later.
    window.localStorage.setItem(MIGRATION_MARKER_KEY, '');
    window.localStorage.setItem(
      LIKHARA_PROJECT_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        id: 'likhara-main',
        name: 'Second Device Workspace',
        root: tree('Second device content'),
      })
    );
    await runLegacyMigration();
    const projects = await listProjects();
    expect(projects).toHaveLength(2);
    expect(projects.filter((p) => p.id === 'likhara-main')).toHaveLength(1);
    const renamed = projects.find((p) => p.name === 'Second Device Workspace');
    expect(renamed).toBeTruthy();
    expect(renamed!.id).not.toBe('likhara-main');
  });

  it('on failure preserves legacy data, saves nothing, and stays retryable', async () => {
    seedLikhara('Must survive');
    // Simulate storage failure by removing the IndexedDB implementation.
    const realIdb = globalThis.indexedDB;
    // @ts-expect-error intentionally breaking the environment
    globalThis.indexedDB = undefined;

    const outcome = await runLegacyMigration();
    globalThis.indexedDB = realIdb;

    expect(outcome.status).toBe('failed');
    expect(window.localStorage.getItem(MIGRATION_MARKER_KEY)).toBeNull();
    expect(
      window.localStorage.getItem(LIKHARA_PROJECT_STORAGE_KEY)
    ).toBeTruthy();

    // Recovery: after storage is restored, the next launch migrates cleanly.
    const retry = await runLegacyMigration();
    expect(retry.status).toBe('done');
    const restored = await getProject('likhara-main');
    expect(restored?.root.children[0].text).toBe('Must survive');
  });
});
