import type { CSSProperties } from 'react';

// ============================================================================
// SECTION 1: DOMAIN TYPES, RECURSIVE UINODE SCHEMA & LIKHARA PROJECT ENVELOPE
// ============================================================================

export type UITag =
  | 'div'
  | 'section'
  | 'nav'
  | 'form'
  | 'button'
  | 'a'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'p'
  | 'span'
  | 'input'
  | 'textarea'
  | 'img'
  | 'hr';

export const ALLOWED_UI_TAGS: readonly UITag[] = [
  'div',
  'section',
  'nav',
  'form',
  'button',
  'a',
  'h1',
  'h2',
  'h3',
  'p',
  'span',
  'input',
  'textarea',
  'img',
  'hr',
] as const;

export type DisplayMode = 'flex' | 'grid-2' | 'grid-3' | 'block';
export type FlexDirectionMode = 'row' | 'column';
export type JustifyMode = 'start' | 'center' | 'end' | 'between';
export type AlignMode = 'start' | 'center' | 'end' | 'stretch';
export type FontSizeToken =
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl';
export type FontWeightToken =
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold';
export type ShadowToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type BlurToken = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type InputFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'search'
  | 'tel'
  | 'url';
export type ButtonActionType =
  | 'none'
  | 'navigate'
  | 'submit'
  | 'custom-event';
export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
export type DropPosition = 'before' | 'after' | 'inside';

export interface NodeStyleConfig {
  /** Master element opacity 0 - 100 */
  opacity: number;
  /** Hex background color (#rrggbb) */
  bgColor: string;
  /** Background alpha transparency 0 - 100 */
  bgAlpha: number;
  /** Hex text color (#rrggbb) */
  textColor: string;
  /** Text alpha transparency 0 - 100 */
  textAlpha: number;
  /** Hex border color (#rrggbb) */
  borderColor: string;
  /** Border alpha transparency 0 - 100 */
  borderAlpha: number;
  /** Horizontal padding in px (0 - 96) */
  paddingX: number;
  /** Vertical padding in px (0 - 96) */
  paddingY: number;
  /** Flex/Grid gap in px (0 - 64) */
  gap: number;
  /** Border width in px (0 - 12) */
  borderWidth: number;
  /** Border line style */
  borderStyle: 'solid' | 'dashed' | 'dotted';
  /** Border radius in px (0 - 48, where 48 = 9999px pill) */
  borderRadius: number;
  /** Backdrop filter blur token */
  backdropBlur: BlurToken;
  /** Box shadow elevation token */
  shadow: ShadowToken;
  /** Display layout mode */
  display: DisplayMode;
  /** Flex direction when display === 'flex' */
  flexDirection: FlexDirectionMode;
  /** Flex justify-content */
  justifyContent: JustifyMode;
  /** Flex align-items */
  alignItems: AlignMode;
  /** CSS width ('100%', 'fit-content', 'auto', or explicit px like '360px') */
  width: string;
  /** CSS height ('auto', or explicit px like '220px') */
  height: string;
  /** Typography scale token */
  fontSize: FontSizeToken;
  /** Typography weight token */
  fontWeight: FontWeightToken;
  /** Typography alignment */
  textAlign: 'left' | 'center' | 'right';
  /** Additional user-defined Tailwind utility classes */
  customClass: string;
}

export interface UINode {
  id: string;
  name: string;
  tag: UITag;
  isContainer: boolean;
  locked?: boolean;
  hidden?: boolean;
  /** Text content for headings, paragraphs, spans, buttons, links */
  text?: string;
  /** Placeholder for input and textarea */
  placeholder?: string;
  /** Destination URL for <a> links */
  href?: string;
  /** Open link in new tab (target="_blank" rel="noopener noreferrer") */
  targetBlank?: boolean;
  /** Image source URL for <img> */
  src?: string;
  /** Accessible alt text for <img> */
  alt?: string;
  /** Input type attribute for <input> */
  inputType?: InputFieldType;
  /** Form control name attribute for <input> and <textarea> */
  nameAttr?: string;
  /** Required validation state for <input> and <textarea> */
  required?: boolean;
  /** Accessible aria-label attribute */
  ariaLabel?: string;
  /** Declarative button action behavior */
  actionType?: ButtonActionType;
  /** Target URL or custom event name for button action */
  actionTarget?: string;
  /** Visual style configuration */
  style: NodeStyleConfig;
  /** Recursive child nodes */
  children: UINode[];
}

export interface LikharaProject {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  viewport: {
    mode: ViewportMode;
    zoom: number;
    background: string;
  };
  root: UINode;
}

export const LIKHARA_PROJECT_STORAGE_KEY = 'likhara_studio_v1_project';
export const LEGACY_CANVIX_STORAGE_KEY = 'canvix_studio_v4_workspace';

export const createNodeId = (prefix = 'node'): string =>
  `${prefix}-${Math.random().toString(36).substring(2, 8)}-${Date.now()
    .toString(36)
    .slice(-3)}`;

export function createDefaultStyle(
  overrides: Partial<NodeStyleConfig> = {}
): NodeStyleConfig {
  return {
    opacity: 100,
    bgColor: '#18181b',
    bgAlpha: 0,
    textColor: '#f4f4f5',
    textAlpha: 100,
    borderColor: '#3f3f46',
    borderAlpha: 100,
    paddingX: 0,
    paddingY: 0,
    gap: 16,
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: 8,
    backdropBlur: 'none',
    shadow: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'start',
    alignItems: 'stretch',
    width: '100%',
    height: 'auto',
    fontSize: 'sm',
    fontWeight: 'normal',
    textAlign: 'left',
    customClass: '',
    ...overrides,
  };
}

// ============================================================================
// SECTION 2: COLOR, ALPHA & TAILWIND TOKEN UTILITIES
// ============================================================================

/**
 * Converts a 3- or 6-digit hex string and 0-100 alpha percentage to a CSS rgba() string.
 */
export function hexToRgba(hex: string, alphaPercent: number): string {
  const clampedAlpha = Math.max(0, Math.min(100, alphaPercent)) / 100;
  if (clampedAlpha <= 0) return 'rgba(0, 0, 0, 0)';

  const clean = (hex || '#000000').replace('#', '').trim();
  let r = 0;
  let g = 0;
  let b = 0;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) || 0;
    g = parseInt(clean[1] + clean[1], 16) || 0;
    b = parseInt(clean[2] + clean[2], 16) || 0;
  } else if (clean.length >= 6) {
    r = parseInt(clean.substring(0, 2), 16) || 0;
    g = parseInt(clean.substring(2, 4), 16) || 0;
    b = parseInt(clean.substring(4, 6), 16) || 0;
  }

  const roundedAlpha = Math.round(clampedAlpha * 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${roundedAlpha})`;
}

/**
 * Formats a Tailwind alpha modifier suffix (e.g., '/80' or '').
 */
export function alphaToTailwindModifier(alphaPercent: number): string {
  const clamped = Math.round(Math.max(0, Math.min(100, alphaPercent)));
  if (clamped >= 100) return '';
  return `/${clamped}`;
}

const FONT_SIZE_CSS: Record<
  FontSizeToken,
  { fontSize: string; lineHeight: string }
> = {
  xs: { fontSize: '0.75rem', lineHeight: '1rem' },
  sm: { fontSize: '0.875rem', lineHeight: '1.35rem' },
  base: { fontSize: '1rem', lineHeight: '1.5rem' },
  lg: { fontSize: '1.125rem', lineHeight: '1.75rem' },
  xl: { fontSize: '1.25rem', lineHeight: '1.75rem' },
  '2xl': { fontSize: '1.5rem', lineHeight: '2rem' },
  '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' },
  '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem' },
};

const FONT_WEIGHT_CSS: Record<FontWeightToken, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

const SHADOW_CSS: Record<ShadowToken, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.32), 0 2px 4px -2px rgba(0, 0, 0, 0.25)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.38), 0 4px 6px -4px rgba(0, 0, 0, 0.25)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.45), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
};

const BLUR_CSS: Record<BlurToken, string> = {
  none: 'none',
  sm: 'blur(4px)',
  md: 'blur(12px)',
  lg: 'blur(16px)',
  xl: 'blur(24px)',
};

function pxToTwScale(prefix: string, px: number): string {
  if (px === 0) return `${prefix}-0`;
  const scaleMap: Record<number, string> = {
    2: '0.5',
    4: '1',
    6: '1.5',
    8: '2',
    10: '2.5',
    12: '3',
    14: '3.5',
    16: '4',
    20: '5',
    24: '6',
    28: '7',
    32: '8',
    36: '9',
    40: '10',
    44: '11',
    48: '12',
    56: '14',
    64: '16',
    80: '20',
    96: '24',
  };
  return scaleMap[px] ? `${prefix}-${scaleMap[px]}` : `${prefix}-[${px}px]`;
}

/**
 * Generates deterministic React.CSSProperties for both the live canvas and the inline exporter.
 */
export function stylesToInlineCSS(node: UINode): CSSProperties {
  const s = node.style;
  const style: CSSProperties = {
    opacity: Math.max(0, Math.min(100, s.opacity)) / 100,
    backgroundColor: hexToRgba(s.bgColor, s.bgAlpha),
    color: hexToRgba(s.textColor, s.textAlpha),
    borderColor: hexToRgba(s.borderColor, s.borderAlpha),
    borderWidth: `${s.borderWidth}px`,
    borderStyle: s.borderWidth > 0 ? s.borderStyle : 'none',
    borderRadius: s.borderRadius >= 48 ? '9999px' : `${s.borderRadius}px`,
    paddingLeft: `${s.paddingX}px`,
    paddingRight: `${s.paddingX}px`,
    paddingTop: `${s.paddingY}px`,
    paddingBottom: `${s.paddingY}px`,
    fontSize: FONT_SIZE_CSS[s.fontSize]?.fontSize || '0.875rem',
    lineHeight: FONT_SIZE_CSS[s.fontSize]?.lineHeight || '1.35rem',
    fontWeight: FONT_WEIGHT_CSS[s.fontWeight] || 400,
    textAlign: s.textAlign,
    boxShadow: SHADOW_CSS[s.shadow] || 'none',
    width: s.width || '100%',
    height: s.height || 'auto',
  };

  if (s.backdropBlur !== 'none') {
    style.backdropFilter = BLUR_CSS[s.backdropBlur];
    style.WebkitBackdropFilter = BLUR_CSS[s.backdropBlur];
  }

  if (node.isContainer) {
    style.gap = `${s.gap}px`;
    if (s.display === 'flex') {
      style.display = 'flex';
      style.flexDirection = s.flexDirection;
      style.justifyContent =
        s.justifyContent === 'start'
          ? 'flex-start'
          : s.justifyContent === 'end'
          ? 'flex-end'
          : s.justifyContent === 'between'
          ? 'space-between'
          : 'center';
      style.alignItems =
        s.alignItems === 'start'
          ? 'flex-start'
          : s.alignItems === 'end'
          ? 'flex-end'
          : s.alignItems === 'stretch'
          ? 'stretch'
          : 'center';
    } else if (s.display === 'grid-2') {
      style.display = 'grid';
      style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    } else if (s.display === 'grid-3') {
      style.display = 'grid';
      style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
    } else {
      style.display = 'block';
    }
  }

  return style;
}

/**
 * Compiles a node's visual style tokens into clean Tailwind CSS classes.
 */
export function stylesToTailwindClasses(node: UINode): string {
  const s = node.style;
  const cls: string[] = [];

  // Width & Height
  if (s.width === '100%') cls.push('w-full');
  else if (s.width === 'fit-content') cls.push('w-fit');
  else if (s.width === 'auto') cls.push('w-auto');
  else if (s.width) cls.push(`w-[${s.width}]`);

  if (s.height && s.height !== 'auto') {
    cls.push(`h-[${s.height}]`);
  }

  // Container Layout
  if (node.isContainer) {
    if (s.display === 'flex') {
      cls.push('flex', s.flexDirection === 'row' ? 'flex-row flex-wrap' : 'flex-col');
      const justifyMap: Record<JustifyMode, string> = {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
      };
      const alignMap: Record<AlignMode, string> = {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      };
      cls.push(justifyMap[s.justifyContent], alignMap[s.alignItems]);
    } else if (s.display === 'grid-2') {
      cls.push('grid', 'grid-cols-1', 'md:grid-cols-2');
    } else if (s.display === 'grid-3') {
      cls.push('grid', 'grid-cols-1', 'md:grid-cols-3');
    } else {
      cls.push('block');
    }

    if (s.gap > 0) cls.push(pxToTwScale('gap', s.gap));
  }

  // Padding
  if (s.paddingX === s.paddingY) {
    if (s.paddingX > 0) cls.push(pxToTwScale('p', s.paddingX));
  } else {
    if (s.paddingX > 0) cls.push(pxToTwScale('px', s.paddingX));
    if (s.paddingY > 0) cls.push(pxToTwScale('py', s.paddingY));
  }

  // Border Radius
  if (s.borderRadius >= 48) cls.push('rounded-full');
  else if (s.borderRadius === 0) cls.push('rounded-none');
  else if (s.borderRadius === 6) cls.push('rounded-md');
  else if (s.borderRadius === 8) cls.push('rounded-lg');
  else if (s.borderRadius === 12) cls.push('rounded-xl');
  else if (s.borderRadius === 16) cls.push('rounded-2xl');
  else if (s.borderRadius === 24) cls.push('rounded-3xl');
  else cls.push(`rounded-[${s.borderRadius}px]`);

  // Background Color + Alpha
  if (s.bgAlpha <= 0) {
    cls.push('bg-transparent');
  } else {
    cls.push(
      `bg-[${s.bgColor.toLowerCase()}]${alphaToTailwindModifier(s.bgAlpha)}`
    );
  }

  // Border Width, Style & Color + Alpha
  if (s.borderWidth > 0) {
    if (s.borderWidth === 1) cls.push('border');
    else if (s.borderWidth === 2) cls.push('border-2');
    else if (s.borderWidth === 4) cls.push('border-4');
    else if (s.borderWidth === 8) cls.push('border-8');
    else cls.push(`border-[${s.borderWidth}px]`);

    if (s.borderStyle !== 'solid') cls.push(`border-${s.borderStyle}`);

    if (s.borderAlpha > 0) {
      cls.push(
        `border-[${s.borderColor.toLowerCase()}]${alphaToTailwindModifier(
          s.borderAlpha
        )}`
      );
    }
  }

  // Text Color + Alpha & Typography
  if (node.tag !== 'hr' && node.tag !== 'img') {
    if (s.textAlpha <= 0) {
      cls.push('text-transparent');
    } else {
      cls.push(
        `text-[${s.textColor.toLowerCase()}]${alphaToTailwindModifier(
          s.textAlpha
        )}`
      );
    }
    cls.push(`text-${s.fontSize}`, `font-${s.fontWeight}`);
    if (s.textAlign !== 'left') cls.push(`text-${s.textAlign}`);
  }

  // Shadow & Backdrop Blur
  if (s.shadow !== 'none') cls.push(`shadow-${s.shadow}`);
  if (s.backdropBlur !== 'none') cls.push(`backdrop-blur-${s.backdropBlur}`);

  // Master Opacity
  if (s.opacity < 100) {
    const std = [0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95];
    if (std.includes(s.opacity)) cls.push(`opacity-${s.opacity}`);
    else cls.push(`opacity-[${(s.opacity / 100).toFixed(2)}]`);
  }

  if (s.customClass.trim()) {
    cls.push(s.customClass.trim());
  }

  return cls.join(' ');
}

export function escapeJSXText(raw = ''): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
}

export function escapeHTMLAttr(raw = ''): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================================================
// SECTION 3: PURE, IMMUTABLE COMPONENT TREE OPERATIONS
// ============================================================================

export function findNodeById(root: UINode, id: string): UINode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const match = findNodeById(child, id);
    if (match) return match;
  }
  return null;
}

export function findParentId(root: UINode, targetId: string): string | null {
  for (const child of root.children) {
    if (child.id === targetId) return root.id;
    const found = findParentId(child, targetId);
    if (found) return found;
  }
  return null;
}

export function isDescendantOrSelf(
  root: UINode,
  candidateAncestorId: string,
  targetId: string
): boolean {
  if (candidateAncestorId === targetId) return true;
  const ancestor = findNodeById(root, candidateAncestorId);
  if (!ancestor) return false;
  return Boolean(findNodeById(ancestor, targetId));
}

export function collectAllIds(
  node: UINode,
  acc: Set<string> = new Set()
): Set<string> {
  acc.add(node.id);
  for (const child of node.children) {
    collectAllIds(child, acc);
  }
  return acc;
}

export function cloneSubtreeWithFreshIds(
  node: UINode,
  existingIds: Set<string> = new Set(),
  isRootCopy = true
): UINode {
  let freshId = createNodeId(node.tag);
  while (existingIds.has(freshId)) {
    freshId = createNodeId(node.tag);
  }
  existingIds.add(freshId);

  return {
    ...node,
    id: freshId,
    name: isRootCopy ? `${node.name} Copy` : node.name,
    style: { ...node.style },
    children: node.children.map((child) =>
      cloneSubtreeWithFreshIds(child, existingIds, false)
    ),
  };
}

export function updateNodeInTree(
  root: UINode,
  targetId: string,
  updater: (node: UINode) => UINode
): UINode {
  if (root.id === targetId) {
    return updater(root);
  }
  let changed = false;
  const nextChildren = root.children.map((child) => {
    const updatedChild = updateNodeInTree(child, targetId, updater);
    if (updatedChild !== child) changed = true;
    return updatedChild;
  });
  return changed ? { ...root, children: nextChildren } : root;
}

export function removeNodeFromTree(root: UINode, targetId: string): UINode {
  if (root.id === targetId) return root; // Cannot remove root
  const filtered = root.children.filter((c) => c.id !== targetId);
  if (filtered.length !== root.children.length) {
    return { ...root, children: filtered };
  }
  let changed = false;
  const nextChildren = root.children.map((c) => {
    const updated = removeNodeFromTree(c, targetId);
    if (updated !== c) changed = true;
    return updated;
  });
  return changed ? { ...root, children: nextChildren } : root;
}

function ensureUniqueNodeIds(node: UINode, existingIds: Set<string>): UINode {
  let id = node.id;
  if (existingIds.has(id)) {
    do {
      id = createNodeId(node.tag);
    } while (existingIds.has(id));
  }
  existingIds.add(id);
  const nextChildren = node.children.map((c) =>
    ensureUniqueNodeIds(c, existingIds)
  );
  const childrenChanged = nextChildren.some((c, i) => c !== node.children[i]);
  if (id === node.id && !childrenChanged) return node;
  return { ...node, id, children: nextChildren };
}

function insertNodeAtTarget(
  root: UINode,
  targetId: string,
  newNode: UINode,
  position: DropPosition
): UINode {
  if (position === 'inside') {
    if (root.id === targetId) {
      return root.isContainer
        ? { ...root, children: [...root.children, newNode] }
        : root;
    }
    let changed = false;
    const nextChildren = root.children.map((c) => {
      const updated = insertNodeAtTarget(c, targetId, newNode, 'inside');
      if (updated !== c) changed = true;
      return updated;
    });
    return changed ? { ...root, children: nextChildren } : root;
  }

  const idx = root.children.findIndex((c) => c.id === targetId);
  if (idx !== -1) {
    const insertIndex = position === 'before' ? idx : idx + 1;
    const nextChildren = [...root.children];
    nextChildren.splice(insertIndex, 0, newNode);
    return { ...root, children: nextChildren };
  }

  let changed = false;
  const nextChildren = root.children.map((c) => {
    const updated = insertNodeAtTarget(c, targetId, newNode, position);
    if (updated !== c) changed = true;
    return updated;
  });
  return changed ? { ...root, children: nextChildren } : root;
}

export function insertNodeInTree(
  root: UINode,
  targetId: string,
  newNode: UINode,
  position: DropPosition
): UINode {
  if (targetId === root.id && position !== 'inside') {
    return root;
  }
  const existingIds = collectAllIds(root);
  const uniqueNode = ensureUniqueNodeIds(newNode, existingIds);
  return insertNodeAtTarget(root, targetId, uniqueNode, position);
}

export function duplicateNodeInTree(
  root: UINode,
  targetId: string
): { tree: UINode; duplicatedId: string | null } {
  if (root.id === targetId) return { tree: root, duplicatedId: null };
  const target = findNodeById(root, targetId);
  if (!target) return { tree: root, duplicatedId: null };

  const existingIds = collectAllIds(root);
  const clone = cloneSubtreeWithFreshIds(target, existingIds, true);
  const nextTree = insertNodeInTree(root, targetId, clone, 'after');
  return { tree: nextTree, duplicatedId: clone.id };
}

export function moveNodeInTree(
  root: UINode,
  sourceId: string,
  targetId: string,
  position: DropPosition
): UINode {
  if (sourceId === root.id || sourceId === 'root' || sourceId === targetId) {
    return root;
  }
  if (isDescendantOrSelf(root, sourceId, targetId)) return root;

  const sourceNode = findNodeById(root, sourceId);
  const targetNode = findNodeById(root, targetId);
  if (!sourceNode || !targetNode || sourceNode.locked || targetNode.locked) {
    return root;
  }

  const effectivePosition: DropPosition =
    position === 'inside' && !targetNode.isContainer ? 'after' : position;

  // Cannot insert before/after the root node itself; would otherwise drop and lose sourceNode.
  if (targetNode.id === root.id && effectivePosition !== 'inside') {
    return root;
  }

  const withoutSource = removeNodeFromTree(root, sourceId);
  return insertNodeAtTarget(
    withoutSource,
    targetId,
    sourceNode,
    effectivePosition
  );
}

export function reorderSiblingInTree(
  root: UINode,
  targetId: string,
  direction: 'up' | 'down'
): UINode {
  const idx = root.children.findIndex((c) => c.id === targetId);
  if (idx !== -1) {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= root.children.length) return root;
    const next = [...root.children];
    const [item] = next.splice(idx, 1);
    next.splice(swapIdx, 0, item);
    return { ...root, children: next };
  }
  let changed = false;
  const nextChildren = root.children.map((c) => {
    const updated = reorderSiblingInTree(c, targetId, direction);
    if (updated !== c) changed = true;
    return updated;
  });
  return changed ? { ...root, children: nextChildren } : root;
}

export function countNodesInTree(node: UINode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodesInTree(c), 0);
}

// ============================================================================
// SECTION 4: SCHEMA VALIDATOR & SAFE SERIALIZATION / DESERIALIZATION
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  root?: UINode;
  projectName?: string;
}

/**
 * Normalizes legacy Canvix node properties (e.g. `layout`, `widthMode`, `extraClassName`)
 * into the canonical Likhara UINode schema so existing saved workspaces migrate cleanly.
 */
export function normalizeNodeSchema(raw: unknown): UINode | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const rawTag = typeof obj.tag === 'string' ? obj.tag : 'div';
  const tag: UITag = (ALLOWED_UI_TAGS as readonly string[]).includes(rawTag)
    ? (rawTag as UITag)
    : 'div';

  const rawStyle =
    obj.style && typeof obj.style === 'object'
      ? (obj.style as Record<string, unknown>)
      : {};

  // Migrate legacy Canvix layout & widthMode tokens if present
  let display: DisplayMode = 'flex';
  let flexDirection: FlexDirectionMode = 'column';
  if (typeof rawStyle.display === 'string') {
    display = rawStyle.display as DisplayMode;
    flexDirection =
      rawStyle.flexDirection === 'row' ? 'row' : 'column';
  } else if (typeof rawStyle.layout === 'string') {
    if (rawStyle.layout === 'flex-row') {
      display = 'flex';
      flexDirection = 'row';
    } else if (rawStyle.layout === 'grid-2') {
      display = 'grid-2';
    } else if (rawStyle.layout === 'grid-3') {
      display = 'grid-3';
    } else if (rawStyle.layout === 'block') {
      display = 'block';
    }
  }

  let width = '100%';
  if (typeof rawStyle.width === 'string') {
    width = rawStyle.width;
  } else if (rawStyle.widthMode === 'fit') {
    width = 'fit-content';
  } else if (rawStyle.widthMode === 'auto') {
    width = 'auto';
  }

  const customClass =
    typeof rawStyle.customClass === 'string'
      ? rawStyle.customClass
      : typeof obj.extraClassName === 'string'
      ? obj.extraClassName
      : '';

  const style: NodeStyleConfig = createDefaultStyle({
    opacity:
      typeof rawStyle.opacity === 'number'
        ? Math.max(0, Math.min(100, rawStyle.opacity))
        : 100,
    bgColor: typeof rawStyle.bgColor === 'string' ? rawStyle.bgColor : '#18181b',
    bgAlpha:
      typeof rawStyle.bgAlpha === 'number'
        ? Math.max(0, Math.min(100, rawStyle.bgAlpha))
        : 0,
    textColor:
      typeof rawStyle.textColor === 'string' ? rawStyle.textColor : '#f4f4f5',
    textAlpha:
      typeof rawStyle.textAlpha === 'number'
        ? Math.max(0, Math.min(100, rawStyle.textAlpha))
        : 100,
    borderColor:
      typeof rawStyle.borderColor === 'string'
        ? rawStyle.borderColor
        : '#3f3f46',
    borderAlpha:
      typeof rawStyle.borderAlpha === 'number'
        ? Math.max(0, Math.min(100, rawStyle.borderAlpha))
        : 100,
    paddingX:
      typeof rawStyle.paddingX === 'number'
        ? Math.max(0, Math.min(160, rawStyle.paddingX))
        : 0,
    paddingY:
      typeof rawStyle.paddingY === 'number'
        ? Math.max(0, Math.min(160, rawStyle.paddingY))
        : 0,
    gap:
      typeof rawStyle.gap === 'number'
        ? Math.max(0, Math.min(96, rawStyle.gap))
        : 16,
    borderWidth:
      typeof rawStyle.borderWidth === 'number'
        ? Math.max(0, Math.min(16, rawStyle.borderWidth))
        : 0,
    borderStyle:
      rawStyle.borderStyle === 'dashed' || rawStyle.borderStyle === 'dotted'
        ? rawStyle.borderStyle
        : 'solid',
    borderRadius:
      typeof rawStyle.borderRadius === 'number'
        ? Math.max(0, Math.min(48, rawStyle.borderRadius))
        : 8,
    backdropBlur:
      typeof rawStyle.backdropBlur === 'string'
        ? (rawStyle.backdropBlur as BlurToken)
        : 'none',
    shadow:
      typeof rawStyle.shadow === 'string' && rawStyle.shadow !== 'glow'
        ? (rawStyle.shadow as ShadowToken)
        : rawStyle.shadow === 'glow'
        ? 'xl'
        : 'none',
    display,
    flexDirection,
    justifyContent:
      typeof rawStyle.justifyContent === 'string'
        ? (rawStyle.justifyContent as JustifyMode)
        : typeof rawStyle.justify === 'string'
        ? (rawStyle.justify as JustifyMode)
        : 'start',
    alignItems:
      typeof rawStyle.alignItems === 'string'
        ? (rawStyle.alignItems as AlignMode)
        : typeof rawStyle.align === 'string'
        ? (rawStyle.align as AlignMode)
        : 'stretch',
    width,
    height: typeof rawStyle.height === 'string' ? rawStyle.height : 'auto',
    fontSize:
      typeof rawStyle.fontSize === 'string'
        ? (rawStyle.fontSize as FontSizeToken)
        : 'sm',
    fontWeight:
      typeof rawStyle.fontWeight === 'string'
        ? (rawStyle.fontWeight as FontWeightToken)
        : 'normal',
    textAlign:
      rawStyle.textAlign === 'center' || rawStyle.textAlign === 'right'
        ? rawStyle.textAlign
        : 'left',
    customClass,
  });

  const rawChildren = Array.isArray(obj.children) ? obj.children : [];
  const children: UINode[] = [];
  for (const child of rawChildren) {
    const normalizedChild = normalizeNodeSchema(child);
    if (normalizedChild) children.push(normalizedChild);
  }

  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id : createNodeId(tag),
    name:
      typeof obj.name === 'string' && obj.name.trim()
        ? obj.name
        : `Element (${tag})`,
    tag,
    isContainer: Boolean(obj.isContainer),
    locked: Boolean(obj.locked),
    hidden: Boolean(obj.hidden),
    text: typeof obj.text === 'string' ? obj.text : undefined,
    placeholder:
      typeof obj.placeholder === 'string' ? obj.placeholder : undefined,
    href: typeof obj.href === 'string' ? obj.href : undefined,
    targetBlank: Boolean(obj.targetBlank),
    src: typeof obj.src === 'string' ? obj.src : undefined,
    alt: typeof obj.alt === 'string' ? obj.alt : undefined,
    inputType:
      typeof obj.inputType === 'string'
        ? (obj.inputType as InputFieldType)
        : undefined,
    nameAttr: typeof obj.nameAttr === 'string' ? obj.nameAttr : undefined,
    required: Boolean(obj.required),
    ariaLabel: typeof obj.ariaLabel === 'string' ? obj.ariaLabel : undefined,
    actionType:
      typeof obj.actionType === 'string'
        ? (obj.actionType as ButtonActionType)
        : undefined,
    actionTarget:
      typeof obj.actionTarget === 'string' ? obj.actionTarget : undefined,
    style,
    children,
  };
}

/**
 * Validates a UINode tree against depth, node count, tag allowlist, and ID uniqueness.
 */
export function validateUINodeTree(
  candidate: unknown,
  maxDepth = 16,
  maxNodes = 400
): ValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  let totalNodes = 0;

  function inspect(rawNode: unknown, depth: number, path: string): void {
    if (depth > maxDepth) {
      errors.push(`${path}: Maximum nesting depth (${maxDepth}) exceeded.`);
      return;
    }
    if (!rawNode || typeof rawNode !== 'object') {
      errors.push(`${path}: Node must be an object.`);
      return;
    }
    totalNodes += 1;
    if (totalNodes > maxNodes) {
      errors.push(`Maximum node limit (${maxNodes}) exceeded.`);
      return;
    }

    const n = rawNode as Record<string, unknown>;
    if (typeof n.id !== 'string' || !n.id.trim()) {
      errors.push(`${path}: Missing valid string 'id'.`);
    } else if (seenIds.has(n.id)) {
      errors.push(`${path}: Duplicate node id '${n.id}' detected.`);
    } else {
      seenIds.add(n.id);
    }

    if (
      typeof n.tag !== 'string' ||
      !(ALLOWED_UI_TAGS as readonly string[]).includes(n.tag)
    ) {
      errors.push(
        `${path}: Unsupported HTML tag '${String(n.tag)}'. Allowed: ${ALLOWED_UI_TAGS.join(', ')}.`
      );
    }

    if (!Array.isArray(n.children)) {
      errors.push(`${path}: 'children' must be an array.`);
    } else {
      n.children.forEach((child, idx) =>
        inspect(child, depth + 1, `${path}.children[${idx}]`)
      );
    }
  }

  inspect(candidate, 0, 'root');

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const normalized = normalizeNodeSchema(candidate);
  if (!normalized) {
    return { valid: false, errors: ['Failed to normalize root node schema.'] };
  }
  // Ensure root ID is always 'root'
  normalized.id = 'root';
  return { valid: true, errors: [], root: normalized };
}

/**
 * Safely parses and validates an imported JSON string (supports both LikharaProject v1
 * envelopes and raw UINode trees). Never mutates application state on failure.
 */
export function parseAndValidateImport(rawJson: string): ValidationResult {
  if (!rawJson || !rawJson.trim()) {
    return { valid: false, errors: ['Import payload is empty.'] };
  }
  if (rawJson.length > 1_000_000) {
    return {
      valid: false,
      errors: ['Import file exceeds 1MB safety threshold.'],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return {
      valid: false,
      errors: [
        `Invalid JSON syntax: ${
          err instanceof Error ? err.message : 'Unable to parse file'
        }`,
      ],
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['Root JSON value must be an object.'] };
  }

  const obj = parsed as Record<string, unknown>;
  // Check if it is a LikharaProject envelope
  if (obj.root && typeof obj.root === 'object') {
    const treeCheck = validateUINodeTree(obj.root);
    return {
      ...treeCheck,
      projectName:
        typeof obj.name === 'string' && obj.name.trim()
          ? obj.name.trim()
          : 'Imported Likhara Project',
    };
  }

  // Otherwise validate as a direct UINode root tree
  const directCheck = validateUINodeTree(obj);
  return {
    ...directCheck,
    projectName: 'Imported Legacy Workspace',
  };
}

// ============================================================================
// SECTION 5: TRANSACTION-AWARE UNDO/REDO HISTORY ENGINE
// ============================================================================

export interface HistoryFrame {
  root: UINode;
  selectedId: string;
  label: string;
  timestamp: number;
}

export const MAX_HISTORY_FRAMES = 50;

export function resolveValidSelectedId(
  root: UINode,
  preferredId: string
): string {
  if (findNodeById(root, preferredId)) return preferredId;
  return 'root';
}

// ============================================================================
// SECTION 6: SEMANTIC CODE COMPILERS & EXPORT DIAGNOSTICS
// ============================================================================

export interface ExportDiagnostic {
  nodeId: string;
  nodeName: string;
  severity: 'warning' | 'info';
  message: string;
}

/**
 * Inspects the visible component tree for semantic or behavioral gaps so the
 * developer is explicitly informed of any unconfigured links, buttons, or inputs.
 */
export function collectExportDiagnostics(root: UINode): ExportDiagnostic[] {
  const diagnostics: ExportDiagnostic[] = [];

  function walk(node: UINode): void {
    if (node.hidden) return;

    if (node.tag === 'a' && (!node.href || !node.href.trim())) {
      diagnostics.push({
        nodeId: node.id,
        nodeName: node.name,
        severity: 'warning',
        message: 'Link (<a>) has no href destination URL configured.',
      });
    }

    if (
      node.tag === 'button' &&
      node.actionType === 'navigate' &&
      (!node.actionTarget || !node.actionTarget.trim())
    ) {
      diagnostics.push({
        nodeId: node.id,
        nodeName: node.name,
        severity: 'warning',
        message:
          'Button action is set to "navigate" but no destination URL is set.',
      });
    }

    if (node.tag === 'input' || node.tag === 'textarea') {
      if (!node.nameAttr || !node.nameAttr.trim()) {
        diagnostics.push({
          nodeId: node.id,
          nodeName: node.name,
          severity: 'info',
          message: `Form control (<${node.tag}>) has no 'name' attribute for form submission.`,
        });
      }
      if (
        (!node.ariaLabel || !node.ariaLabel.trim()) &&
        (!node.placeholder || !node.placeholder.trim())
      ) {
        diagnostics.push({
          nodeId: node.id,
          nodeName: node.name,
          severity: 'warning',
          message: `Form control (<${node.tag}>) lacks both aria-label and placeholder.`,
        });
      }
    }

    if (node.tag === 'img') {
      if (!node.alt || !node.alt.trim()) {
        diagnostics.push({
          nodeId: node.id,
          nodeName: node.name,
          severity: 'warning',
          message: 'Image (<img>) is missing accessible alt text.',
        });
      }
    }

    node.children.forEach(walk);
  }

  walk(root);
  return diagnostics;
}

function buildSemanticAttributesJSX(node: UINode): string {
  const attrs: string[] = [];

  if (node.ariaLabel && node.ariaLabel.trim()) {
    attrs.push(`aria-label="${escapeHTMLAttr(node.ariaLabel.trim())}"`);
  }

  if (node.tag === 'a') {
    const href = node.href?.trim() || '#';
    attrs.push(`href="${escapeHTMLAttr(href)}"`);
    if (node.targetBlank) {
      attrs.push('target="_blank"', 'rel="noopener noreferrer"');
    }
  }

  if (node.tag === 'button') {
    const btnType = node.actionType === 'submit' ? 'submit' : 'button';
    attrs.push(`type="${btnType}"`);
    if (node.actionType === 'navigate' && node.actionTarget?.trim()) {
      const targetUrl = node.actionTarget.trim().replace(/'/g, "\\'");
      attrs.push(`onClick={() => { window.location.href = '${targetUrl}'; }}`);
    } else if (node.actionType === 'custom-event' && node.actionTarget?.trim()) {
      const evtName = node.actionTarget.trim().replace(/'/g, "\\'");
      attrs.push(
        `onClick={() => { window.dispatchEvent(new CustomEvent('${evtName}')); }}`
      );
    }
  }

  if (node.tag === 'input') {
    attrs.push(`type="${escapeHTMLAttr(node.inputType || 'text')}"`);
    if (node.nameAttr?.trim()) {
      attrs.push(`name="${escapeHTMLAttr(node.nameAttr.trim())}"`);
    }
    if (node.placeholder?.trim()) {
      attrs.push(`placeholder="${escapeHTMLAttr(node.placeholder.trim())}"`);
    }
    if (node.required) {
      attrs.push('required');
    }
  }

  if (node.tag === 'textarea') {
    if (node.nameAttr?.trim()) {
      attrs.push(`name="${escapeHTMLAttr(node.nameAttr.trim())}"`);
    }
    if (node.placeholder?.trim()) {
      attrs.push(`placeholder="${escapeHTMLAttr(node.placeholder.trim())}"`);
    }
    if (node.required) {
      attrs.push('required');
    }
  }

  if (node.tag === 'img') {
    attrs.push(
      `src="${escapeHTMLAttr(
        node.src?.trim() ||
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
      )}"`
    );
    attrs.push(`alt="${escapeHTMLAttr(node.alt?.trim() || node.name)}"`);
  }

  if (node.tag === 'form') {
    attrs.push('onSubmit={(e) => { e.preventDefault(); }}');
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

function buildSemanticAttributesHTML(node: UINode): string {
  const attrs: string[] = [];

  if (node.ariaLabel && node.ariaLabel.trim()) {
    attrs.push(`aria-label="${escapeHTMLAttr(node.ariaLabel.trim())}"`);
  }

  if (node.tag === 'a') {
    const href = node.href?.trim() || '#';
    attrs.push(`href="${escapeHTMLAttr(href)}"`);
    if (node.targetBlank) {
      attrs.push('target="_blank"', 'rel="noopener noreferrer"');
    }
  }

  if (node.tag === 'button') {
    const btnType = node.actionType === 'submit' ? 'submit' : 'button';
    attrs.push(`type="${btnType}"`);
    if (node.actionType === 'navigate' && node.actionTarget?.trim()) {
      attrs.push(
        `data-action="navigate" data-target="${escapeHTMLAttr(
          node.actionTarget.trim()
        )}"`
      );
    } else if (node.actionType === 'custom-event' && node.actionTarget?.trim()) {
      attrs.push(
        `data-action="custom-event" data-event="${escapeHTMLAttr(
          node.actionTarget.trim()
        )}"`
      );
    }
  }

  if (node.tag === 'input') {
    attrs.push(`type="${escapeHTMLAttr(node.inputType || 'text')}"`);
    if (node.nameAttr?.trim()) {
      attrs.push(`name="${escapeHTMLAttr(node.nameAttr.trim())}"`);
    }
    if (node.placeholder?.trim()) {
      attrs.push(`placeholder="${escapeHTMLAttr(node.placeholder.trim())}"`);
    }
    if (node.required) {
      attrs.push('required');
    }
  }

  if (node.tag === 'textarea') {
    if (node.nameAttr?.trim()) {
      attrs.push(`name="${escapeHTMLAttr(node.nameAttr.trim())}"`);
    }
    if (node.placeholder?.trim()) {
      attrs.push(`placeholder="${escapeHTMLAttr(node.placeholder.trim())}"`);
    }
    if (node.required) {
      attrs.push('required');
    }
  }

  if (node.tag === 'img') {
    attrs.push(
      `src="${escapeHTMLAttr(
        node.src?.trim() ||
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
      )}"`
    );
    attrs.push(`alt="${escapeHTMLAttr(node.alt?.trim() || node.name)}"`);
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

export function compileNodeToReactTailwind(node: UINode, depth = 2): string {
  if (node.hidden) return '';
  const indent = '  '.repeat(depth);
  const tw = stylesToTailwindClasses(node);
  const classAttr = tw ? ` className="${escapeHTMLAttr(tw)}"` : '';
  const semAttrs = buildSemanticAttributesJSX(node);

  if (node.tag === 'hr' || node.tag === 'input' || node.tag === 'img') {
    return `${indent}<${node.tag}${classAttr}${semAttrs} />`;
  }

  if (node.tag === 'textarea') {
    return `${indent}<textarea${classAttr}${semAttrs} />`;
  }

  const visibleChildren = node.children.filter((c) => !c.hidden);
  if (visibleChildren.length > 0) {
    const inner = visibleChildren
      .map((c) => compileNodeToReactTailwind(c, depth + 1))
      .filter(Boolean)
      .join('\n');
    return `${indent}<${node.tag}${classAttr}${semAttrs}>\n${inner}\n${indent}</${node.tag}>`;
  }

  const textContent = escapeJSXText(node.text || '');
  if (!textContent && node.isContainer) {
    return `${indent}<${node.tag}${classAttr}${semAttrs} />`;
  }
  return `${indent}<${node.tag}${classAttr}${semAttrs}>${textContent}</${node.tag}>`;
}

export function compileToReactTailwind(root: UINode): string {
  const body = compileNodeToReactTailwind(root, 2);
  return `import React from 'react';

export default function LikharaExportedUI() {
  return (
${body}
  );
}`;
}

export function compileNodeToReactInline(node: UINode, depth = 2): string {
  if (node.hidden) return '';
  const indent = '  '.repeat(depth);
  const styleObj = stylesToInlineCSS(node);
  const styleAttr = ` style={${JSON.stringify(styleObj)}}`;
  const semAttrs = buildSemanticAttributesJSX(node);

  if (node.tag === 'hr' || node.tag === 'input' || node.tag === 'img') {
    return `${indent}<${node.tag}${styleAttr}${semAttrs} />`;
  }

  if (node.tag === 'textarea') {
    return `${indent}<textarea${styleAttr}${semAttrs} />`;
  }

  const visibleChildren = node.children.filter((c) => !c.hidden);
  if (visibleChildren.length > 0) {
    const inner = visibleChildren
      .map((c) => compileNodeToReactInline(c, depth + 1))
      .filter(Boolean)
      .join('\n');
    return `${indent}<${node.tag}${styleAttr}${semAttrs}>\n${inner}\n${indent}</${node.tag}>`;
  }

  const textContent = escapeJSXText(node.text || '');
  return `${indent}<${node.tag}${styleAttr}${semAttrs}>${textContent}</${node.tag}>`;
}

export function compileToReactInlineStyle(root: UINode): string {
  const body = compileNodeToReactInline(root, 2);
  return `import React from 'react';

export default function LikharaInlineExportedUI() {
  return (
${body}
  );
}`;
}

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function compileNodeToHTML(node: UINode, depth = 2): string {
  if (node.hidden) return '';
  const indent = '  '.repeat(depth);
  const tw = stylesToTailwindClasses(node);
  const styleObj = stylesToInlineCSS(node);
  const cssStr = Object.entries(styleObj)
    .filter(([, v]) => v !== undefined && v !== 'none')
    .map(([k, v]) => `${camelToKebab(k)}: ${v}`)
    .join('; ');

  const classAttr = tw ? ` class="${escapeHTMLAttr(tw)}"` : '';
  const styleAttr = cssStr ? ` style="${escapeHTMLAttr(cssStr)}"` : '';
  const semAttrs = buildSemanticAttributesHTML(node);

  if (node.tag === 'hr' || node.tag === 'input' || node.tag === 'img') {
    return `${indent}<${node.tag}${classAttr}${styleAttr}${semAttrs} />`;
  }

  if (node.tag === 'textarea') {
    return `${indent}<textarea${classAttr}${styleAttr}${semAttrs}></textarea>`;
  }

  const visibleChildren = node.children.filter((c) => !c.hidden);
  if (visibleChildren.length > 0) {
    const inner = visibleChildren
      .map((c) => compileNodeToHTML(c, depth + 1))
      .filter(Boolean)
      .join('\n');
    return `${indent}<${node.tag}${classAttr}${styleAttr}${semAttrs}>\n${inner}\n${indent}</${node.tag}>`;
  }

  const textContent = escapeJSXText(node.text || '');
  return `${indent}<${node.tag}${classAttr}${styleAttr}${semAttrs}>${textContent}</${node.tag}>`;
}

export function compileToStandaloneHTML(
  root: UINode,
  projectName = 'Likhara Exported UI'
): string {
  const body = compileNodeToHTML(root, 2);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeJSXText(projectName)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 p-6 min-h-screen">
${body}
</body>
</html>`;
}

// ============================================================================
// STARTER TEMPLATES & PALETTE DEFINITIONS
// ============================================================================

export type PrimitiveType =
  | 'section'
  | 'flex-row'
  | 'card'
  | 'form-box'
  | 'nav-bar'
  | 'heading'
  | 'paragraph'
  | 'badge'
  | 'button'
  | 'link'
  | 'input'
  | 'textarea'
  | 'image'
  | 'divider';

interface PaletteDefinition {
  type: PrimitiveType;
  label: string;
  description: string;
  category: 'container' | 'element';
  createNode: () => UINode;
}

export const PALETTE_DEFINITIONS: PaletteDefinition[] = [
  {
    type: 'section',
    label: 'Section Container',
    description: 'Full-width vertical section (<section>)',
    category: 'container',
    createNode: () => ({
      id: createNodeId('section'),
      name: 'Section Container',
      tag: 'section',
      isContainer: true,
      style: createDefaultStyle({
        bgColor: '#18181b',
        bgAlpha: 90,
        borderColor: '#27272a',
        borderAlpha: 100,
        borderWidth: 1,
        borderRadius: 12,
        paddingX: 24,
        paddingY: 24,
        gap: 16,
      }),
      children: [],
    }),
  },
  {
    type: 'flex-row',
    label: 'Flex Row',
    description: 'Horizontal aligned group (<div>)',
    category: 'container',
    createNode: () => ({
      id: createNodeId('row'),
      name: 'Flex Row',
      tag: 'div',
      isContainer: true,
      style: createDefaultStyle({
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'between',
        alignItems: 'center',
        paddingX: 12,
        paddingY: 12,
        gap: 12,
        bgColor: '#18181b',
        bgAlpha: 50,
        borderColor: '#27272a',
        borderAlpha: 80,
        borderWidth: 1,
        borderRadius: 8,
      }),
      children: [],
    }),
  },
  {
    type: 'card',
    label: 'Surface Card',
    description: 'Bordered card container (<div>)',
    category: 'container',
    createNode: () => ({
      id: createNodeId('card'),
      name: 'Surface Card',
      tag: 'div',
      isContainer: true,
      style: createDefaultStyle({
        bgColor: '#18181b',
        bgAlpha: 95,
        borderColor: '#3f3f46',
        borderAlpha: 70,
        borderWidth: 1,
        borderRadius: 12,
        paddingX: 20,
        paddingY: 20,
        gap: 14,
        shadow: 'lg',
      }),
      children: [],
    }),
  },
  {
    type: 'form-box',
    label: 'Form Container',
    description: 'Interactive form block (<form>)',
    category: 'container',
    createNode: () => ({
      id: createNodeId('form'),
      name: 'Form Container',
      tag: 'form',
      isContainer: true,
      ariaLabel: 'User Form',
      style: createDefaultStyle({
        bgColor: '#18181b',
        bgAlpha: 85,
        borderColor: '#3f3f46',
        borderAlpha: 80,
        borderWidth: 1,
        borderRadius: 12,
        paddingX: 20,
        paddingY: 20,
        gap: 14,
      }),
      children: [],
    }),
  },
  {
    type: 'nav-bar',
    label: 'Navigation Bar',
    description: 'Top navigation bar (<nav>)',
    category: 'container',
    createNode: () => ({
      id: createNodeId('nav'),
      name: 'Navigation Bar',
      tag: 'nav',
      isContainer: true,
      ariaLabel: 'Primary Navigation',
      style: createDefaultStyle({
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'between',
        alignItems: 'center',
        bgColor: '#09090b',
        bgAlpha: 90,
        borderColor: '#27272a',
        borderAlpha: 100,
        borderWidth: 1,
        borderRadius: 10,
        paddingX: 20,
        paddingY: 12,
        gap: 16,
      }),
      children: [],
    }),
  },
  {
    type: 'heading',
    label: 'Heading',
    description: 'Section title (<h2>)',
    category: 'element',
    createNode: () => ({
      id: createNodeId('h2'),
      name: 'Heading',
      tag: 'h2',
      isContainer: false,
      text: 'Composable UI Architecture',
      style: createDefaultStyle({
        textColor: '#fafafa',
        textAlpha: 100,
        fontSize: '2xl',
        fontWeight: 'bold',
        customClass: 'tracking-tight',
      }),
      children: [],
    }),
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    description: 'Body copy (<p>)',
    category: 'element',
    createNode: () => ({
      id: createNodeId('p'),
      name: 'Paragraph',
      tag: 'p',
      isContainer: false,
      text: 'Configure semantic attributes, adjust opacity and RGBA channel sliders, and export validated React or HTML source.',
      style: createDefaultStyle({
        textColor: '#a1a1aa',
        textAlpha: 95,
        fontSize: 'sm',
        fontWeight: 'normal',
      }),
      children: [],
    }),
  },
  {
    type: 'badge',
    label: 'Status Badge',
    description: 'Compact label pill (<span>)',
    category: 'element',
    createNode: () => ({
      id: createNodeId('badge'),
      name: 'Status Badge',
      tag: 'span',
      isContainer: false,
      text: 'Likhara v1.0',
      style: createDefaultStyle({
        width: 'fit-content',
        bgColor: '#0284c7',
        bgAlpha: 20,
        textColor: '#38bdf8',
        textAlpha: 100,
        borderColor: '#0284c7',
        borderAlpha: 45,
        borderWidth: 1,
        borderRadius: 48,
        paddingX: 10,
        paddingY: 4,
        fontSize: 'xs',
        fontWeight: 'semibold',
      }),
      children: [],
    }),
  },
  {
    type: 'button',
    label: 'Action Button',
    description: 'Semantic CTA button (<button>)',
    category: 'element',
    createNode: () => ({
      id: createNodeId('btn'),
      name: 'Action Button',
      tag: 'button',
      isContainer: false,
      text: 'Deploy Workspace',
      actionType: 'submit',
      ariaLabel: 'Deploy Workspace',
      style: createDefaultStyle({
        width: 'fit-content',
        bgColor: '#0284c7',
        bgAlpha: 100,
        textColor: '#ffffff',
        textAlpha: 100,
        borderRadius: 8,
        paddingX: 18,
        paddingY: 10,
        fontSize: 'sm',
        fontWeight: 'semibold',
        textAlign: 'center',
        customClass: 'cursor-pointer transition-opacity hover:opacity-90',
      }),
      children: [],
    }),
  },
  {
    type: 'link',
    label: 'Anchor Link',
    description: 'Navigational link (<a>)',
    category: 'element',
    createNode: () => ({
      id: createNodeId('link'),
      name: 'Documentation Link',
      tag: 'a',
      isContainer: false,
      text: 'Read Documentation →',
      href: 'https://developer.mozilla.org',
      targetBlank: true,
      ariaLabel: 'Read Documentation',
      style: createDefaultStyle({
        width: 'fit-content',
        textColor: '#38bdf8',
        textAlpha: 100,
        fontSize: 'sm',
        fontWeight: 'medium',
        customClass: 'underline-offset-4 hover:underline',
      }),
      children: [],
    }),
  },
  {
    type: 'input',
    label: 'Text Input',
    description: 'Form input control (<input>)',
    category: 'element',
    createNode: () => ({
      id: createNodeId('input'),
      name: 'Email Input',
      tag: 'input',
      isContainer: false,
      inputType: 'email',
      nameAttr: 'user_email',
      placeholder: 'engineer@likhara.dev',
      ariaLabel: 'Email Address',
      required: true,
      style: createDefaultStyle({
        width: '100%',
        bgColor: '#09090b',
        bgAlpha: 90,
        textColor: '#f4f4f5',
        textAlpha: 100,
        borderColor: '#3f3f46',
        borderAlpha: 90,
        borderWidth: 1,
        borderRadius: 8,
        paddingX: 12,
        paddingY: 10,
        fontSize: 'sm',
      }),
      children: [],
    }),
  },
  {
    type: 'textarea',
    label: 'Textarea',
    description: 'Multiline text field (<textarea>)',
    category: 'element',
    createNode: () => ({
      id: createNodeId('textarea'),
      name: 'Message Textarea',
      tag: 'textarea',
      isContainer: false,
      nameAttr: 'project_notes',
      placeholder: 'Describe your component requirements...',
      ariaLabel: 'Project Notes',
      required: false,
      style: createDefaultStyle({
        width: '100%',
        height: '96px',
        bgColor: '#09090b',
        bgAlpha: 90,
        textColor: '#f4f4f5',
        textAlpha: 100,
        borderColor: '#3f3f46',
        borderAlpha: 90,
        borderWidth: 1,
        borderRadius: 8,
        paddingX: 12,
        paddingY: 10,
        fontSize: 'sm',
      }),
      children: [],
    }),
  },
  {
    type: 'image',
    label: 'Image Element',
    description: 'Responsive image (<img>)',
    category: 'element',
    createNode: () => ({
      id: createNodeId('img'),
      name: 'Feature Image',
      tag: 'img',
      isContainer: false,
      src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      alt: 'Abstract geometric surface preview',
      style: createDefaultStyle({
        width: '100%',
        height: '180px',
        borderRadius: 10,
        borderColor: '#27272a',
        borderAlpha: 80,
        borderWidth: 1,
        customClass: 'object-cover',
      }),
      children: [],
    }),
  },
  {
    type: 'divider',
    label: 'Divider Line',
    description: 'Horizontal rule (<hr>)',
    category: 'element',
    createNode: () => ({
      id: createNodeId('hr'),
      name: 'Section Divider',
      tag: 'hr',
      isContainer: false,
      style: createDefaultStyle({
        width: '100%',
        borderColor: '#27272a',
        borderAlpha: 100,
        borderWidth: 1,
      }),
      children: [],
    }),
  },
];

export const DEFAULT_LIKHARA_STARTER_TREE: UINode = {
  id: 'root',
  name: 'Root Workspace',
  tag: 'div',
  isContainer: true,
  style: createDefaultStyle({
    bgColor: '#09090b',
    bgAlpha: 100,
    borderColor: '#27272a',
    borderAlpha: 100,
    borderWidth: 1,
    borderRadius: 16,
    paddingX: 28,
    paddingY: 28,
    gap: 20,
    shadow: 'xl',
  }),
  children: [
    {
      id: 'likhara-nav',
      name: 'Top Navigation',
      tag: 'nav',
      isContainer: true,
      ariaLabel: 'Workspace Navigation',
      style: createDefaultStyle({
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'between',
        alignItems: 'center',
        bgColor: '#18181b',
        bgAlpha: 80,
        borderColor: '#27272a',
        borderAlpha: 100,
        borderWidth: 1,
        borderRadius: 10,
        paddingX: 16,
        paddingY: 10,
        gap: 12,
      }),
      children: [
        {
          id: 'likhara-badge',
          name: 'Release Tag',
          tag: 'span',
          isContainer: false,
          text: 'LIKHARA STUDIO • SCHEMA v1',
          style: createDefaultStyle({
            width: 'fit-content',
            bgColor: '#0284c7',
            bgAlpha: 20,
            textColor: '#38bdf8',
            textAlpha: 100,
            borderColor: '#0284c7',
            borderAlpha: 45,
            borderWidth: 1,
            borderRadius: 48,
            paddingX: 12,
            paddingY: 4,
            fontSize: 'xs',
            fontWeight: 'semibold',
          }),
          children: [],
        },
        {
          id: 'likhara-docs-link',
          name: 'Spec Link',
          tag: 'a',
          isContainer: false,
          text: 'Stage 1 Architecture Spec ↗',
          href: 'https://react.dev',
          targetBlank: true,
          ariaLabel: 'Stage 1 Architecture Spec',
          style: createDefaultStyle({
            width: 'fit-content',
            textColor: '#a1a1aa',
            textAlpha: 100,
            fontSize: 'xs',
            fontWeight: 'medium',
            customClass: 'hover:text-white transition-colors',
          }),
          children: [],
        },
      ],
    },
    {
      id: 'likhara-hero-card',
      name: 'Main Feature Card',
      tag: 'section',
      isContainer: true,
      style: createDefaultStyle({
        bgColor: '#18181b',
        bgAlpha: 75,
        borderColor: '#3f3f46',
        borderAlpha: 70,
        borderWidth: 1,
        borderRadius: 14,
        paddingX: 24,
        paddingY: 24,
        gap: 16,
        backdropBlur: 'md',
        shadow: 'lg',
      }),
      children: [
        {
          id: 'likhara-heading',
          name: 'Hero Title',
          tag: 'h1',
          isContainer: false,
          text: 'Visual React Architecture with Full Semantic Fidelity',
          style: createDefaultStyle({
            textColor: '#fafafa',
            textAlpha: 100,
            fontSize: '2xl',
            fontWeight: 'bold',
            customClass: 'tracking-tight',
          }),
          children: [],
        },
        {
          id: 'likhara-desc',
          name: 'Hero Copy',
          tag: 'p',
          isContainer: false,
          text: 'Every element preserves its master opacity (0–100%), RGBA color channels, box dimensions, and semantic HTML attributes across React Tailwind, Inline Style, and HTML exports.',
          style: createDefaultStyle({
            textColor: '#a1a1aa',
            textAlpha: 95,
            fontSize: 'sm',
            fontWeight: 'normal',
          }),
          children: [],
        },
        {
          id: 'likhara-lead-form',
          name: 'Quick Action Form',
          tag: 'form',
          isContainer: true,
          ariaLabel: 'Quick Action Form',
          style: createDefaultStyle({
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'start',
            alignItems: 'center',
            gap: 10,
            paddingY: 4,
          }),
          children: [
            {
              id: 'likhara-email-input',
              name: 'Developer Email Input',
              tag: 'input',
              isContainer: false,
              inputType: 'email',
              nameAttr: 'developer_email',
              placeholder: 'architect@likhara.dev',
              ariaLabel: 'Developer Email',
              required: true,
              style: createDefaultStyle({
                width: '260px',
                bgColor: '#09090b',
                bgAlpha: 90,
                textColor: '#fafafa',
                textAlpha: 100,
                borderColor: '#3f3f46',
                borderAlpha: 90,
                borderWidth: 1,
                borderRadius: 8,
                paddingX: 14,
                paddingY: 10,
                fontSize: 'sm',
              }),
              children: [],
            },
            {
              id: 'likhara-submit-btn',
              name: 'Submit CTA Button',
              tag: 'button',
              isContainer: false,
              text: 'Verify & Export',
              actionType: 'submit',
              ariaLabel: 'Verify and Export',
              style: createDefaultStyle({
                width: 'fit-content',
                bgColor: '#0284c7',
                bgAlpha: 100,
                textColor: '#ffffff',
                textAlpha: 100,
                borderRadius: 8,
                paddingX: 18,
                paddingY: 10,
                fontSize: 'sm',
                fontWeight: 'semibold',
                customClass: 'cursor-pointer whitespace-nowrap',
              }),
              children: [],
            },
          ],
        },
      ],
    },
  ],
};
