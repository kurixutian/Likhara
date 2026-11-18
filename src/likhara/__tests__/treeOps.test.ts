import { describe, it, expect } from 'vitest';
import {
  UINode,
  createDefaultStyle,
  insertNodeInTree,
  removeNodeFromTree,
  duplicateNodeInTree,
  moveNodeInTree,
  reorderSiblingInTree,
  resolveValidSelectedId,
  findNodeById,
  collectAllIds,
} from '../core';

function makeNode(
  id: string,
  opts: Partial<UINode> = {}
): UINode {
  return {
    id,
    tag: opts.tag ?? 'div',
    name: opts.name ?? id,
    isContainer: opts.isContainer ?? true,
    style: createDefaultStyle(opts.style),
    children: opts.children ?? [],
    ...opts,
  };
}

function makeSampleTree(): UINode {
  return makeNode('root', {
    children: [
      makeNode('header', {
        children: [makeNode('title', { isContainer: false, tag: 'h1' })],
      }),
      makeNode('card', {
        children: [makeNode('btn', { isContainer: false, tag: 'button' })],
      }),
      makeNode('footer', { isContainer: false, tag: 'p' }),
    ],
  });
}

describe('tree operations', () => {
  it('insertNodeInTree inserts before, after, and inside without mutating input', () => {
    const tree = makeSampleTree();
    const fresh = makeNode('badge', { isContainer: false, tag: 'span' });

    const before = insertNodeInTree(tree, 'card', fresh, 'before');
    expect(before.children.map((c) => c.id)).toEqual([
      'header',
      'badge',
      'card',
      'footer',
    ]);
    expect(tree.children.map((c) => c.id)).toEqual(['header', 'card', 'footer']);

    const after = insertNodeInTree(tree, 'card', fresh, 'after');
    expect(after.children.map((c) => c.id)).toEqual([
      'header',
      'card',
      'badge',
      'footer',
    ]);

    const inside = insertNodeInTree(tree, 'card', fresh, 'inside');
    expect(findNodeById(inside, 'card')?.children.map((c) => c.id)).toEqual([
      'btn',
      'badge',
    ]);
  });

  it('insertNodeInTree enforces unique node IDs when inserting a colliding ID', () => {
    const tree = makeSampleTree();
    const colliding = makeNode('card', { isContainer: false, tag: 'span' });
    const next = insertNodeInTree(tree, 'root', colliding, 'inside');
    const ids = collectAllIds(next);
    expect(next.children.length).toBe(4);
    expect(ids.size).toBe(7); // root, header, title, card, btn, footer + 1 unique
  });

  it('removeNodeFromTree never removes root and returns same reference on missing id', () => {
    const tree = makeSampleTree();
    expect(removeNodeFromTree(tree, 'root')).toBe(tree);
    expect(removeNodeFromTree(tree, 'nonexistent')).toBe(tree);

    const removed = removeNodeFromTree(tree, 'card');
    expect(removed.children.map((c) => c.id)).toEqual(['header', 'footer']);
    expect(findNodeById(removed, 'btn')).toBeNull();
  });

  it('duplicateNodeInTree creates fresh IDs for the entire subtree', () => {
    const tree = makeSampleTree();
    const { tree: next, duplicatedId } = duplicateNodeInTree(tree, 'card');
    expect(duplicatedId).toBeTruthy();
    expect(next.children.length).toBe(4);
    const dup = findNodeById(next, duplicatedId!);
    expect(dup).not.toBeNull();
    expect(dup!.children.length).toBe(1);
    expect(dup!.children[0].id).not.toBe('btn');
  });

  it('moveNodeInTree rejects cycles, root moves, locked nodes, and root before/after', () => {
    const tree = makeSampleTree();
    // Cycle: moving header into its child title
    expect(moveNodeInTree(tree, 'header', 'title', 'inside')).toBe(tree);
    // Moving root
    expect(moveNodeInTree(tree, 'root', 'card', 'inside')).toBe(tree);
    // Moving before/after root (would otherwise delete the node)
    expect(moveNodeInTree(tree, 'card', 'root', 'before')).toBe(tree);
    expect(moveNodeInTree(tree, 'card', 'root', 'after')).toBe(tree);

    // Locked source or target
    const withLocked = {
      ...tree,
      children: tree.children.map((c) =>
        c.id === 'header' ? { ...c, locked: true } : c
      ),
    };
    expect(moveNodeInTree(withLocked, 'header', 'card', 'inside')).toBe(
      withLocked
    );
    expect(moveNodeInTree(withLocked, 'card', 'header', 'inside')).toBe(
      withLocked
    );
  });

  it('moveNodeInTree moves a container with children into another container', () => {
    const tree = makeSampleTree();
    const moved = moveNodeInTree(tree, 'card', 'header', 'inside');
    expect(moved.children.map((c) => c.id)).toEqual(['header', 'footer']);
    const header = findNodeById(moved, 'header');
    expect(header?.children.map((c) => c.id)).toEqual(['title', 'card']);
    expect(findNodeById(moved, 'btn')).not.toBeNull();
  });

  it('reorderSiblingInTree swaps siblings within bounds and is no-op at edges', () => {
    const tree = makeSampleTree();
    expect(reorderSiblingInTree(tree, 'header', 'up')).toBe(tree);
    expect(reorderSiblingInTree(tree, 'footer', 'down')).toBe(tree);

    const movedDown = reorderSiblingInTree(tree, 'header', 'down');
    expect(movedDown.children.map((c) => c.id)).toEqual([
      'card',
      'header',
      'footer',
    ]);
  });

  it('resolveValidSelectedId falls back to root when selection is removed', () => {
    const tree = makeSampleTree();
    expect(resolveValidSelectedId(tree, 'btn')).toBe('btn');
    expect(resolveValidSelectedId(tree, 'missing-id')).toBe('root');
  });
});
