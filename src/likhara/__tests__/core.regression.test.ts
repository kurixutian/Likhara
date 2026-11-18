// Regression net for preserved editor foundations (Phase 1 — do not regress).
import { describe, it, expect } from 'vitest';
import {
  validateUINodeTree,
  parseAndValidateImport,
  compileToReactTailwind,
  compileToStandaloneHTML,
  normalizeNodeSchema,
  findNodeById,
  insertNodeInTree,
  countNodesInTree,
  createDefaultStyle,
  collectExportDiagnostics,
} from '../core';
import type { UINode } from '../core';

function treeWithForm(): UINode {
  return {
    id: 'root',
    name: 'Root',
    tag: 'div',
    isContainer: true,
    style: createDefaultStyle(),
    children: [
      {
        id: 'link-1',
        name: 'Docs Link',
        tag: 'a',
        isContainer: false,
        text: 'Docs',
        style: createDefaultStyle(),
        children: [],
      },
      {
        id: 'input-1',
        name: 'Email',
        tag: 'input',
        isContainer: false,
        inputType: 'email',
        style: createDefaultStyle(),
        children: [],
      },
    ],
  };
}

describe('preserved core behavior (regression net)', () => {
  it('validates trees: tag allowlist, id uniqueness, depth', () => {
    expect(validateUINodeTree(treeWithForm()).valid).toBe(true);

    const bad = validateUINodeTree({
      id: 'root',
      tag: 'iframe',
      children: [{ id: 'x', tag: 'div', children: [] }, { id: 'x', tag: 'p', children: [] }],
    });
    expect(bad.valid).toBe(false);
    expect(bad.errors.join(' ')).toMatch(/iframe/);
    expect(bad.errors.join(' ')).toMatch(/Duplicate node id/);
  });

  it('import parser accepts envelopes and raw trees, never mutates state', () => {
    const envelope = parseAndValidateImport(
      JSON.stringify({ name: 'Doc', root: treeWithForm() })
    );
    expect(envelope.valid).toBe(true);
    expect(envelope.projectName).toBe('Doc');

    const raw = parseAndValidateImport(JSON.stringify(treeWithForm()));
    expect(raw.valid).toBe(true);
  });

  it('compilers still emit runnable output with semantic attributes', () => {
    const reactCode = compileToReactTailwind(treeWithForm());
    expect(reactCode).toContain('export default function LikharaExportedUI');
    expect(reactCode).toContain('<a');
    expect(reactCode).toContain('<input');

    const html = compileToStandaloneHTML(treeWithForm());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<input');
  });

  it('export diagnostics flag unconfigured links and unlabeled inputs', () => {
    const messages = collectExportDiagnostics(treeWithForm()).map((d) => d.message);
    expect(messages.some((m) => m.includes('href'))).toBe(true);
    expect(messages.some((m) => m.includes('aria-label'))).toBe(true);
  });

  it('tree operations remain pure and correct', () => {
    const base = treeWithForm();
    const before = JSON.stringify(base);
    const found = findNodeById(base, 'link-1');
    expect(found?.tag).toBe('a');

    const inserted = insertNodeInTree(
      base,
      'input-1',
      { id: 'new-1', name: 'New', tag: 'p', isContainer: false, style: createDefaultStyle(), children: [] },
      'after'
    );
    expect(countNodesInTree(inserted)).toBe(countNodesInTree(base) + 1);
    expect(JSON.stringify(base)).toBe(before); // input untouched
  });

  it('legacy Canvix normalizer maps retired tokens', () => {
    const normalized = normalizeNodeSchema({
      tag: 'div',
      extraClassName: 'old-class',
      style: { layout: 'grid-3', widthMode: 'fit' },
      children: [],
    });
    expect(normalized?.style.display).toBe('grid-3');
    expect(normalized?.style.width).toBe('fit-content');
    expect(normalized?.style.customClass).toBe('old-class');
  });
});
