import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Box,
  Columns,
  Trash2,
  Copy,
  Check,
  Eye,
  Layers,
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Undo2,
  Redo2,
  Smartphone,
  Tablet,
  Monitor,
  Sliders,
  FileCode,
  Sun,
  Download,
  Upload,
  Lock,
  Unlock,
  Home,
  EyeOff,
  Grid,
  ZoomIn,
  ZoomOut,
  CornerUpLeft,
  Play,
  PenTool,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  FileJson,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  ALLOWED_UI_TAGS,
  hexToRgba,
  stylesToInlineCSS,
  findNodeById,
  findParentId,
  collectAllIds,
  cloneSubtreeWithFreshIds,
  updateNodeInTree,
  removeNodeFromTree,
  insertNodeInTree,
  duplicateNodeInTree,
  moveNodeInTree,
  reorderSiblingInTree,
  countNodesInTree,
  parseAndValidateImport,
  resolveValidSelectedId,
  collectExportDiagnostics,
  compileToReactTailwind,
  compileToReactInlineStyle,
  compileToStandaloneHTML,
  MAX_HISTORY_FRAMES,
  PALETTE_DEFINITIONS,
  DEFAULT_LIKHARA_STARTER_TREE,
} from './core';
import type {
  UINode,
  LikharaProject,
  HistoryFrame,
  PrimitiveType,
  ViewportMode,
  DropPosition,
  NodeStyleConfig,
  FontSizeToken,
  FontWeightToken,
  InputFieldType,
  ButtonActionType,
  UITag,
} from './core';
import { saveProjectRecord } from './projects/storage';

// ============================================================================
// SECTION 7: INTERACTION CONTROLLERS & UI SUB-COMPONENTS
// ============================================================================

const CURATED_SWATCHES = [
  '#09090b',
  '#18181b',
  '#27272a',
  '#fafafa',
  '#0284c7',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#6366f1',
];

interface ColorAlphaControlProps {
  label: string;
  hexColor: string;
  alphaPercent: number;
  onGestureStart: () => void;
  onLiveChange: (patch: { hex?: string; alpha?: number }) => void;
  onGestureCommit: (label: string) => void;
  allowClear?: boolean;
}

const ColorAlphaControl: React.FC<ColorAlphaControlProps> = ({
  label,
  hexColor,
  alphaPercent,
  onGestureStart,
  onLiveChange,
  onGestureCommit,
  allowClear = true,
}) => {
  const liveRgba = hexToRgba(hexColor, alphaPercent);

  return (
    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/90 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          {label}
        </span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
          {alphaPercent === 0
            ? 'Transparent'
            : `${hexColor.toUpperCase()} • ${alphaPercent}%`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label
          title={`Pick ${label} color`}
          className="relative w-8 h-8 rounded-md overflow-hidden border border-zinc-700 cursor-pointer shrink-0"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #3f3f46 25%, transparent 25%), linear-gradient(-45deg, #3f3f46 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3f3f46 75%), linear-gradient(-45deg, transparent 75%, #3f3f46 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
            }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: liveRgba }}
          />
          <input
            type="color"
            aria-label={`${label} color picker`}
            value={hexColor}
            onFocus={onGestureStart}
            onChange={(e) => {
              onLiveChange({
                hex: e.target.value,
                alpha: alphaPercent === 0 ? 100 : alphaPercent,
              });
            }}
            onBlur={() => onGestureCommit(`Change ${label} Color`)}
            className="opacity-0 w-full h-full cursor-pointer"
          />
        </label>

        <input
          type="text"
          aria-label={`${label} hex value`}
          value={hexColor}
          onFocus={onGestureStart}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
              onLiveChange({ hex: val });
            }
          }}
          onBlur={() => onGestureCommit(`Edit ${label} Hex`)}
          className="w-24 px-2 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-100 focus:outline-none focus:border-sky-500"
        />

        {allowClear && (
          <button
            type="button"
            onClick={() => {
              onGestureStart();
              onLiveChange({ alpha: alphaPercent === 0 ? 100 : 0 });
              setTimeout(() => onGestureCommit(`Toggle ${label} Alpha`), 0);
            }}
            className={`px-2 py-1.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
              alphaPercent === 0
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {alphaPercent === 0 ? 'Restore' : 'Clear'}
          </button>
        )}
      </div>

      {/* Alpha Transparency Slider (0% - 100%) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-400">Alpha / Transparency</span>
          <span className="font-mono text-zinc-200">{alphaPercent}%</span>
        </div>
        <input
          type="range"
          aria-label={`${label} alpha transparency`}
          min={0}
          max={100}
          step={1}
          value={alphaPercent}
          onPointerDown={onGestureStart}
          onChange={(e) => onLiveChange({ alpha: Number(e.target.value) })}
          onPointerUp={() => onGestureCommit(`Adjust ${label} Alpha`)}
          onKeyUp={() => onGestureCommit(`Adjust ${label} Alpha`)}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 bg-zinc-800"
        />
      </div>

      {/* Swatches */}
      <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
        {CURATED_SWATCHES.map((swatch) => {
          const isSelected =
            hexColor.toLowerCase() === swatch.toLowerCase() && alphaPercent > 0;
          return (
            <button
              key={swatch}
              type="button"
              aria-label={`Select color ${swatch}`}
              onClick={() => {
                onGestureStart();
                onLiveChange({
                  hex: swatch,
                  alpha: alphaPercent === 0 ? 100 : alphaPercent,
                });
                setTimeout(() => onGestureCommit(`Select ${label} Swatch`), 0);
              }}
              style={{ backgroundColor: swatch }}
              className={`w-4 h-4 rounded border transition-transform cursor-pointer ${
                isSelected
                  ? 'scale-125 border-white ring-1 ring-sky-400'
                  : 'border-zinc-700 hover:scale-110'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN LIKHARA STUDIO EDITOR (mounted by App for a single open project)
// ============================================================================

export default function LikharaEditor({
  project,
  onExit,
}: {
  project: LikharaProject;
  onExit: () => void;
}) {
  const initialRoot = project.root;
  const initialSelectedId = resolveValidSelectedId(
    initialRoot,
    'likhara-hero-card'
  );

  const [projectMeta, setProjectMeta] = useState<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>({
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>(
    'saved'
  );
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Transaction-Aware Undo/Redo History State
  const [history, setHistory] = useState<HistoryFrame[]>([
    {
      root: initialRoot,
      selectedId: initialSelectedId,
      label: 'Initial Workspace',
      timestamp: Date.now(),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Live active root during continuous gestures (sliders, resizing, typing)
  const [liveRoot, setLiveRoot] = useState<UINode>(initialRoot);
  const [selectedId, setSelectedId] = useState<string>(initialSelectedId);
  const gestureStartSnapshotRef = useRef<UINode | null>(null);

  // Workspace UI Transient State (strictly separated from persisted project document)
  const [leftTab, setLeftTab] = useState<'palette' | 'layers'>('palette');
  const [inspectorTab, setInspectorTab] = useState<'style' | 'semantics'>(
    'style'
  );
  const [insertMode, setInsertMode] = useState<DropPosition>('inside');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [canvasZoom, setCanvasZoom] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [workspaceMode, setWorkspaceMode] = useState<
    'design' | 'split' | 'preview'
  >('split');
  const [codeFormat, setCodeFormat] = useState<
    'react-tw' | 'react-inline' | 'html'
  >('react-tw');

  // Drag & Drop and Pointer Resize Transient State
  const [dragState, setDragState] = useState<{
    targetId: string;
    position: DropPosition;
  } | null>(null);
  const [previewFeedback, setPreviewFeedback] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'success' | 'error';
    messages: string[];
  } | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Mobile shell state (< 1024px): canvas-first drawers, one side panel at a
  // time. Purely presentational — selection and project data are untouched.
  const [mobilePanel, setMobilePanel] = useState<
    'none' | 'left' | 'inspector'
  >('none');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isPreviewMode = workspaceMode === 'preview';

  // Ensure selectedId always points to an existing node
  const activeSelectedId = useMemo(
    () => resolveValidSelectedId(liveRoot, selectedId),
    [liveRoot, selectedId]
  );

  const selectedNode = useMemo(
    () => findNodeById(liveRoot, activeSelectedId) || liveRoot,
    [liveRoot, activeSelectedId]
  );

  const parentIdOfSelected = useMemo(
    () => findParentId(liveRoot, selectedNode.id),
    [liveRoot, selectedNode.id]
  );

  const totalNodes = useMemo(() => countNodesInTree(liveRoot), [liveRoot]);

  // --------------------------------------------------------------------------
  // Project Autosave Effect (IndexedDB, scoped by project id)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setSaveStatus('saving');
    const timer = window.setTimeout(() => {
      const updatedProject: LikharaProject = {
        schemaVersion: 1,
        id: projectMeta.id,
        name: projectMeta.name,
        createdAt: projectMeta.createdAt,
        updatedAt: new Date().toISOString(),
        viewport: {
          mode: viewportMode,
          zoom: canvasZoom,
          background: '#09090b',
        },
        root: liveRoot,
      };
      // In-flight save carries its own project id, so a late write lands on the
      // correct record even if the user switches projects; `cancelled` only
      // stops stale results from polluting the new editor's save indicator.
      saveProjectRecord(updatedProject).then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setSaveStatus('saved');
          setSaveErrorMsg(null);
        } else {
          setSaveStatus('error');
          setSaveErrorMsg(res.error || 'Storage write failed');
        }
      });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [liveRoot, projectMeta, viewportMode, canvasZoom]);

  // --------------------------------------------------------------------------
  // Transaction & History Operations
  // --------------------------------------------------------------------------
  const commitTree = useCallback(
    (nextRoot: UINode, nextSelectId?: string, label = 'Edit Element') => {
      setLiveRoot(nextRoot);
      const validSel = resolveValidSelectedId(
        nextRoot,
        nextSelectId ?? activeSelectedId
      );
      setSelectedId(validSel);

      setHistory((prev) => {
        const currentFrame = prev[historyIndex];
        if (
          currentFrame &&
          JSON.stringify(currentFrame.root) === JSON.stringify(nextRoot)
        ) {
          return prev; // Deduplicate no-op commits
        }
        const sliced = prev.slice(0, historyIndex + 1);
        const pushed: HistoryFrame = {
          root: nextRoot,
          selectedId: validSel,
          label,
          timestamp: Date.now(),
        };
        const updated = [...sliced, pushed];
        return updated.length > MAX_HISTORY_FRAMES
          ? updated.slice(updated.length - MAX_HISTORY_FRAMES)
          : updated;
      });

      setHistoryIndex((prevIdx) => {
        const currentFrame = history[prevIdx];
        if (
          currentFrame &&
          JSON.stringify(currentFrame.root) === JSON.stringify(nextRoot)
        ) {
          return prevIdx;
        }
        return Math.min(prevIdx + 1, MAX_HISTORY_FRAMES - 1);
      });
    },
    [activeSelectedId, history, historyIndex]
  );

  const beginGestureTransaction = useCallback(() => {
    if (!gestureStartSnapshotRef.current) {
      gestureStartSnapshotRef.current = liveRoot;
    }
  }, [liveRoot]);

  const replaceCurrentTreeFrame = useCallback((nextRoot: UINode) => {
    setLiveRoot(nextRoot);
  }, []);

  const endGestureTransaction = useCallback(
    (label = 'Adjust Style') => {
      const startTree = gestureStartSnapshotRef.current;
      gestureStartSnapshotRef.current = null;
      if (
        startTree &&
        JSON.stringify(startTree) === JSON.stringify(liveRoot)
      ) {
        return; // No actual change occurred during gesture
      }
      commitTree(liveRoot, activeSelectedId, label);
    },
    [liveRoot, activeSelectedId, commitTree]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const targetIdx = historyIndex - 1;
    const frame = history[targetIdx];
    if (!frame) return;
    setHistoryIndex(targetIdx);
    setLiveRoot(frame.root);
    setSelectedId(resolveValidSelectedId(frame.root, frame.selectedId));
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const targetIdx = historyIndex + 1;
    const frame = history[targetIdx];
    if (!frame) return;
    setHistoryIndex(targetIdx);
    setLiveRoot(frame.root);
    setSelectedId(resolveValidSelectedId(frame.root, frame.selectedId));
  }, [history, historyIndex]);

  // Keyboard shortcuts for Undo / Redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // --------------------------------------------------------------------------
  // Selected Node Updaters
  // --------------------------------------------------------------------------
  const updateSelectedLive = useCallback(
    (updater: (node: UINode) => UINode) => {
      if (selectedNode.locked) return;
      setLiveRoot((prev) => updateNodeInTree(prev, selectedNode.id, updater));
    },
    [selectedNode.id, selectedNode.locked]
  );

  const updateSelectedDiscrete = useCallback(
    (updater: (node: UINode) => UINode, label: string) => {
      if (selectedNode.locked) return;
      const next = updateNodeInTree(liveRoot, selectedNode.id, updater);
      commitTree(next, selectedNode.id, label);
    },
    [liveRoot, selectedNode.id, selectedNode.locked, commitTree]
  );

  const updateSelectedStyleLive = useCallback(
    (patch: Partial<NodeStyleConfig>) => {
      updateSelectedLive((n) => ({
        ...n,
        style: { ...n.style, ...patch },
      }));
    },
    [updateSelectedLive]
  );

  const updateSelectedStyleDiscrete = useCallback(
    (patch: Partial<NodeStyleConfig>, label: string) => {
      updateSelectedDiscrete(
        (n) => ({
          ...n,
          style: { ...n.style, ...patch },
        }),
        label
      );
    },
    [updateSelectedDiscrete]
  );

  // --------------------------------------------------------------------------
  // Tree Action Handlers (Insert, Delete, Duplicate, Move, Lock/Hide)
  // --------------------------------------------------------------------------
  const handleInsertPrimitive = (type: PrimitiveType) => {
    const def = PALETTE_DEFINITIONS.find((d) => d.type === type);
    if (!def) return;
    const existingIds = collectAllIds(liveRoot);
    const freshNode = cloneSubtreeWithFreshIds(
      def.createNode(),
      existingIds,
      false
    );

    let targetId = selectedNode.id;
    let pos: DropPosition = insertMode;

    if (pos === 'inside' && !selectedNode.isContainer) {
      targetId = parentIdOfSelected || 'root';
      pos = 'inside';
    }
    if (targetId === 'root' && (pos === 'before' || pos === 'after')) {
      pos = 'inside';
    }

    const next = insertNodeInTree(liveRoot, targetId, freshNode, pos);
    commitTree(next, freshNode.id, `Add ${def.label}`);
  };

  const handleDeleteNode = (id: string) => {
    if (id === 'root') return;
    const node = findNodeById(liveRoot, id);
    if (!node || node.locked) return;
    const fallbackId = findParentId(liveRoot, id) || 'root';
    const next = removeNodeFromTree(liveRoot, id);
    commitTree(next, fallbackId, `Delete ${node.name}`);
  };

  const handleDuplicateNode = (id: string) => {
    if (id === 'root') return;
    const res = duplicateNodeInTree(liveRoot, id);
    if (res.duplicatedId) {
      commitTree(res.tree, res.duplicatedId, 'Duplicate Element');
    }
  };

  const handleReorderSibling = (id: string, dir: 'up' | 'down') => {
    if (id === 'root') return;
    const next = reorderSiblingInTree(liveRoot, id, dir);
    commitTree(next, id, `Move Element ${dir === 'up' ? 'Up' : 'Down'}`);
  };

  const handleToggleNodeFlag = (id: string, flag: 'locked' | 'hidden') => {
    const next = updateNodeInTree(liveRoot, id, (n) => ({
      ...n,
      [flag]: !n[flag],
    }));
    commitTree(next, activeSelectedId, `Toggle ${flag}`);
  };

  // --------------------------------------------------------------------------
  // Zoom-Compensated Pointer Resizing Controller
  // --------------------------------------------------------------------------
  const handleStartResize = (
    e: React.PointerEvent<HTMLDivElement>,
    node: UINode
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (node.locked || isPreviewMode) return;

    const targetEl = (e.currentTarget as HTMLElement).parentElement;
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();
    const scale = canvasZoom / 100;
    const startWidth = Math.round(rect.width / scale);
    const startHeight = Math.round(rect.height / scale);
    const startX = e.clientX;
    const startY = e.clientY;

    beginGestureTransaction();

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaX = (moveEvt.clientX - startX) / scale;
      const deltaY = (moveEvt.clientY - startY) / scale;
      const nextW = Math.max(64, Math.min(1200, Math.round(startWidth + deltaX)));
      const nextH = Math.max(32, Math.min(900, Math.round(startHeight + deltaY)));

      replaceCurrentTreeFrame(
        updateNodeInTree(liveRoot, node.id, (n) => ({
          ...n,
          style: {
            ...n.style,
            width: `${nextW}px`,
            height: `${nextH}px`,
          },
        }))
      );
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      endGestureTransaction(`Resize ${node.name}`);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // --------------------------------------------------------------------------
  // Drag and Drop Controller (with Before / After / Inside Drop Zones)
  // --------------------------------------------------------------------------
  const handlePaletteDragStart = (
    e: React.DragEvent<HTMLElement>,
    type: PrimitiveType
  ) => {
    e.dataTransfer.setData('application/likhara-source', 'palette');
    e.dataTransfer.setData('application/likhara-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleNodeDragStart = (
    e: React.DragEvent<HTMLElement>,
    node: UINode
  ) => {
    e.stopPropagation();
    if (node.id === 'root' || node.locked || isPreviewMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/likhara-source', 'canvas');
    e.dataTransfer.setData('application/likhara-node-id', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleNodeDragOver = (
    e: React.DragEvent<HTMLElement>,
    targetNode: UINode
  ) => {
    if (isPreviewMode) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const ratio = rect.height > 0 ? relY / rect.height : 0.5;

    let position: DropPosition = 'inside';
    if (targetNode.id === 'root') {
      position = 'inside';
    } else if (targetNode.isContainer) {
      if (ratio < 0.22) position = 'before';
      else if (ratio > 0.78) position = 'after';
      else position = 'inside';
    } else {
      position = ratio < 0.5 ? 'before' : 'after';
    }

    if (
      !dragState ||
      dragState.targetId !== targetNode.id ||
      dragState.position !== position
    ) {
      setDragState({ targetId: targetNode.id, position });
    }
  };

  const handleNodeDrop = (
    e: React.DragEvent<HTMLElement>,
    targetNode: UINode
  ) => {
    if (isPreviewMode) return;
    e.preventDefault();
    e.stopPropagation();

    const dropPos: DropPosition = dragState?.position || 'inside';
    setDragState(null);

    const source = e.dataTransfer.getData('application/likhara-source');
    if (source === 'palette') {
      const primitiveType = e.dataTransfer.getData(
        'application/likhara-type'
      ) as PrimitiveType;
      const def = PALETTE_DEFINITIONS.find((d) => d.type === primitiveType);
      if (!def) return;
      const existingIds = collectAllIds(liveRoot);
      const newNode = cloneSubtreeWithFreshIds(
        def.createNode(),
        existingIds,
        false
      );
      const effectivePos: DropPosition =
        dropPos === 'inside' && !targetNode.isContainer ? 'after' : dropPos;
      const next = insertNodeInTree(
        liveRoot,
        targetNode.id,
        newNode,
        effectivePos
      );
      commitTree(next, newNode.id, `Drop ${def.label}`);
    } else if (source === 'canvas') {
      const draggedId = e.dataTransfer.getData('application/likhara-node-id');
      if (!draggedId || draggedId === targetNode.id) return;
      const next = moveNodeInTree(liveRoot, draggedId, targetNode.id, dropPos);
      if (next !== liveRoot) {
        commitTree(next, draggedId, 'Move Element');
      }
    }
  };

  // --------------------------------------------------------------------------
  // Export, Import & Diagnostics Computed Values
  // --------------------------------------------------------------------------
  const exportDiagnostics = useMemo(
    () => collectExportDiagnostics(liveRoot),
    [liveRoot]
  );

  const selectedNodeDiagnostics = useMemo(
    () => exportDiagnostics.filter((d) => d.nodeId === selectedNode.id),
    [exportDiagnostics, selectedNode.id]
  );

  const compiledCode = useMemo(() => {
    if (codeFormat === 'react-tw') return compileToReactTailwind(liveRoot);
    if (codeFormat === 'react-inline')
      return compileToReactInlineStyle(liveRoot);
    return compileToStandaloneHTML(liveRoot, projectMeta.name);
  }, [liveRoot, codeFormat, projectMeta.name]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(compiledCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = compiledCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadCode = () => {
    const ext = codeFormat === 'html' ? 'html' : 'tsx';
    const mime = codeFormat === 'html' ? 'text/html' : 'text/typescript';
    const blob = new Blob([compiledCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LikharaExportedUI.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportProjectJSON = () => {
    const doc: LikharaProject = {
      schemaVersion: 1,
      id: projectMeta.id,
      name: projectMeta.name,
      createdAt: projectMeta.createdAt,
      updatedAt: new Date().toISOString(),
      viewport: {
        mode: viewportMode,
        zoom: canvasZoom,
        background: '#09090b',
      },
      root: liveRoot,
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectMeta.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') || 'likhara-project'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyValidatedImport = (rawJson: string) => {
    const result = parseAndValidateImport(rawJson);
    if (!result.valid || !result.root) {
      setImportFeedback({
        type: 'error',
        messages: result.errors,
      });
      return;
    }

    if (result.projectName) {
      setProjectMeta((prev) => ({
        ...prev,
        name: result.projectName!,
        updatedAt: new Date().toISOString(),
      }));
    }
    commitTree(result.root, 'root', 'Import Validated Project');
    setImportFeedback({
      type: 'success',
      messages: ['Project schema validated and imported cleanly.'],
    });
    setShowImportModal(false);
    setImportJsonText('');
  };

  const handleFileUploadImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleApplyValidatedImport(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --------------------------------------------------------------------------
  // Recursive Canvas Renderer
  // --------------------------------------------------------------------------
  const renderCanvasNode = (node: UINode): React.ReactNode => {
    if (node.hidden) return null;

    const isSelected = !isPreviewMode && selectedNode.id === node.id;
    const isDropTarget = !isPreviewMode && dragState?.targetId === node.id;
    const inlineStyle = stylesToInlineCSS(node);

    const dropRingClass =
      isDropTarget && dragState?.position === 'inside'
        ? 'ring-2 ring-sky-400 bg-sky-500/5'
        : isDropTarget && dragState?.position === 'before'
        ? 'border-t-2 border-t-sky-400'
        : isDropTarget && dragState?.position === 'after'
        ? 'border-b-2 border-b-sky-400'
        : '';

    const selectionRingClass = !isPreviewMode
      ? isSelected
        ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-zinc-950'
        : 'hover:ring-1 hover:ring-zinc-600'
      : '';

    const combinedClass = [
      'relative transition-shadow duration-100',
      node.style.customClass,
      selectionRingClass,
      dropRingClass,
    ]
      .filter(Boolean)
      .join(' ');

    // Floating Action Bar on Selected Element
    const floatingBar = isSelected ? (
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute -top-7 left-0 z-30 flex items-center gap-1 px-2 py-0.5 rounded bg-sky-600 text-white shadow-lg text-[10px] font-mono select-none whitespace-nowrap"
      >
        <span className="font-bold">&lt;{node.tag}&gt;</span>
        <span className="font-sans font-medium pr-1">{node.name}</span>
        <span className="px-1 rounded bg-sky-900/80 text-[9px]">
          {node.style.opacity}%
        </span>

        {parentIdOfSelected && (
          <button
            type="button"
            aria-label="Select parent container"
            title="Select Parent Container"
            onClick={() => setSelectedId(parentIdOfSelected)}
            className="p-0.5 hover:bg-sky-500 rounded cursor-pointer"
          >
            <CornerUpLeft className="w-3 h-3" />
          </button>
        )}
        {node.id !== 'root' && !node.locked && (
          <>
            <button
              type="button"
              aria-label="Move element up"
              title="Move Up"
              onClick={() => handleReorderSibling(node.id, 'up')}
              className="p-0.5 hover:bg-sky-500 rounded cursor-pointer"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              aria-label="Move element down"
              title="Move Down"
              onClick={() => handleReorderSibling(node.id, 'down')}
              className="p-0.5 hover:bg-sky-500 rounded cursor-pointer"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <button
              type="button"
              aria-label="Duplicate element"
              title="Duplicate"
              onClick={() => handleDuplicateNode(node.id)}
              className="p-0.5 hover:bg-sky-500 rounded cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              type="button"
              aria-label="Delete element"
              title="Delete"
              onClick={() => handleDeleteNode(node.id)}
              className="p-0.5 hover:bg-rose-600 rounded cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    ) : null;

    // Pointer Resize Handle on Selected Element
    const resizeHandle =
      isSelected && node.id !== 'root' && !node.locked ? (
        <div
          onPointerDown={(e) => handleStartResize(e, node)}
          title="Drag to resize width & height"
          className="absolute -bottom-1.5 -right-1.5 z-30 w-3.5 h-3.5 rounded-sm bg-sky-500 border border-zinc-950 cursor-nwse-resize shadow"
        />
      ) : null;

    const commonInteractionProps = {
      draggable: !isPreviewMode && node.id !== 'root' && !node.locked,
      onDragStart: (e: React.DragEvent<HTMLElement>) =>
        handleNodeDragStart(e, node),
      onDragOver: (e: React.DragEvent<HTMLElement>) =>
        handleNodeDragOver(e, node),
      onDrop: (e: React.DragEvent<HTMLElement>) => handleNodeDrop(e, node),
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        if (!isPreviewMode) {
          e.stopPropagation();
          setSelectedId(node.id);
          return;
        }
        // In Preview Mode, execute configured button/link semantics
        if (node.tag === 'button') {
          if (node.actionType === 'navigate' && node.actionTarget) {
            setPreviewFeedback(`Navigate action → ${node.actionTarget}`);
          } else if (node.actionType === 'custom-event' && node.actionTarget) {
            setPreviewFeedback(`Dispatched CustomEvent("${node.actionTarget}")`);
          }
        } else if (node.tag === 'a') {
          e.preventDefault();
          setPreviewFeedback(
            `Anchor navigation → ${node.href || '#'} (${
              node.targetBlank ? 'new tab' : 'same tab'
            })`
          );
        }
      },
    };

    if (node.tag === 'hr') {
      return (
        <div
          key={node.id}
          {...commonInteractionProps}
          className={`relative py-2 cursor-pointer ${selectionRingClass}`}
        >
          {floatingBar}
          <hr style={inlineStyle} />
        </div>
      );
    }

    if (node.tag === 'img') {
      return (
        <div
          key={node.id}
          {...commonInteractionProps}
          style={{ width: node.style.width, height: node.style.height }}
          className={`relative inline-block ${selectionRingClass}`}
        >
          {floatingBar}
          {resizeHandle}
          <img
            src={
              node.src ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
            }
            alt={node.alt || node.name}
            style={{ ...inlineStyle, width: '100%', height: '100%' }}
            className={`${node.style.customClass} block pointer-events-none`}
          />
        </div>
      );
    }

    if (node.tag === 'input' || node.tag === 'textarea') {
      return (
        <div
          key={node.id}
          {...commonInteractionProps}
          style={{ width: node.style.width }}
          className={`relative ${selectionRingClass}`}
        >
          {floatingBar}
          {resizeHandle}
          {node.tag === 'input' ? (
            <input
              type={node.inputType || 'text'}
              name={node.nameAttr}
              placeholder={node.placeholder || ''}
              required={node.required}
              aria-label={node.ariaLabel || node.placeholder || node.name}
              readOnly={!isPreviewMode}
              style={{ ...inlineStyle, width: '100%' }}
              className={`${node.style.customClass} focus:outline-none ${
                !isPreviewMode ? 'pointer-events-none' : ''
              }`}
            />
          ) : (
            <textarea
              name={node.nameAttr}
              placeholder={node.placeholder || ''}
              required={node.required}
              aria-label={node.ariaLabel || node.placeholder || node.name}
              readOnly={!isPreviewMode}
              style={{ ...inlineStyle, width: '100%' }}
              className={`${node.style.customClass} focus:outline-none ${
                !isPreviewMode ? 'pointer-events-none' : ''
              }`}
            />
          )}
        </div>
      );
    }

    // Dynamic tag: React.ElementType keeps JSX props permissive for the
    // union of all allowed element types (e.g. onSubmit typed per element).
    const TagComponent: React.ElementType = node.tag;

    return (
      <TagComponent
        key={node.id}
        {...commonInteractionProps}
        aria-label={node.ariaLabel}
        onSubmit={
          node.tag === 'form'
            ? (e: React.FormEvent<HTMLElement>) => {
                e.preventDefault();
                if (isPreviewMode) {
                  setPreviewFeedback(
                    `Form "${node.name}" validated and submitted in Preview.`
                  );
                }
              }
            : undefined
        }
        style={inlineStyle}
        className={combinedClass}
      >
        {floatingBar}
        {resizeHandle}
        {node.isContainer ? (
          node.children.length > 0 ? (
            node.children.map((child) => renderCanvasNode(child))
          ) : (
            <div className="w-full min-h-[72px] rounded-lg border border-dashed border-zinc-700/80 bg-zinc-900/30 flex flex-col items-center justify-center p-3 text-center select-none pointer-events-none">
              <Plus className="w-4 h-4 text-zinc-500 mb-1" />
              <span className="text-[11px] text-zinc-400 font-medium">
                Empty {node.name} (&lt;{node.tag}&gt;)
              </span>
              <span className="text-[10px] text-zinc-500">
                Drop elements or click + in palette
              </span>
            </div>
          )
        ) : (
          node.text
        )}
      </TagComponent>
    );
  };

  // --------------------------------------------------------------------------
  // Recursive DOM Layer Tree Panel
  // --------------------------------------------------------------------------
  const renderLayerNode = (node: UINode, depth = 0): React.ReactNode => {
    const isSelected = selectedNode.id === node.id;
    const isCollapsed = collapsedIds.has(node.id);

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => setSelectedId(node.id)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={`group flex items-center justify-between py-1.5 pr-1.5 rounded-md text-xs cursor-pointer transition-colors ${
            isSelected
              ? 'bg-sky-500/15 text-sky-200 border border-sky-500/40 font-medium'
              : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200 border border-transparent'
          } ${node.hidden ? 'opacity-40' : ''}`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {node.isContainer && node.children.length > 0 ? (
              <button
                type="button"
                aria-label={isCollapsed ? 'Expand layer' : 'Collapse layer'}
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(node.id)) next.delete(node.id);
                    else next.add(node.id);
                    return next;
                  });
                }}
                className="p-0.5 text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className="w-4 inline-block shrink-0" />
            )}
            <span className="font-mono text-[10px] text-zinc-500 shrink-0">
              &lt;{node.tag}&gt;
            </span>
            <span className="truncate">{node.name}</span>
          </div>

          {node.id !== 'root' && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-0.5 opacity-75 group-hover:opacity-100 shrink-0"
            >
              <button
                type="button"
                aria-label="Move layer up"
                title="Move Up"
                onClick={() => handleReorderSibling(node.id, 'up')}
                className="p-1 hover:text-white cursor-pointer"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                aria-label="Move layer down"
                title="Move Down"
                onClick={() => handleReorderSibling(node.id, 'down')}
                className="p-1 hover:text-white cursor-pointer"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                aria-label={node.locked ? 'Unlock layer' : 'Lock layer'}
                title={node.locked ? 'Unlock' : 'Lock'}
                onClick={() => handleToggleNodeFlag(node.id, 'locked')}
                className="p-1 hover:text-amber-400 cursor-pointer"
              >
                {node.locked ? (
                  <Lock className="w-3 h-3 text-amber-400" />
                ) : (
                  <Unlock className="w-3 h-3 text-zinc-600" />
                )}
              </button>
              <button
                type="button"
                aria-label={node.hidden ? 'Show layer' : 'Hide layer'}
                title={node.hidden ? 'Show' : 'Hide'}
                onClick={() => handleToggleNodeFlag(node.id, 'hidden')}
                className="p-1 hover:text-sky-400 cursor-pointer"
              >
                {node.hidden ? (
                  <EyeOff className="w-3 h-3 text-rose-400" />
                ) : (
                  <Eye className="w-3 h-3 text-zinc-600" />
                )}
              </button>
            </div>
          )}
        </div>

        {!isCollapsed && node.children.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {node.children.map((child) => renderLayerNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden font-sans select-none">
      {/* ====================================================================
          TOP OPERATIONAL WORKSPACE BAR (LIKHARA STUDIO)
         ==================================================================== */}
      <header className="h-13 shrink-0 border-b border-zinc-800 bg-zinc-900 px-2 sm:px-3 flex items-center justify-between gap-2 relative">
        {/* Left: Brand Identity + Project Name + Save/Migration Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            aria-label="Back to Project Home"
            title="Back to Project Home"
            onClick={onExit}
            className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer shrink-0"
          >
            <Home className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 rounded-md bg-sky-600 flex items-center justify-center text-white font-bold text-[10px] tracking-wider shrink-0">
            LK
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-xs font-semibold tracking-tight text-zinc-100">
                Likhara Studio
              </span>
              <input
                type="text"
                aria-label="Project Name"
                value={projectMeta.name}
                onChange={(e) =>
                  setProjectMeta((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-medium focus:outline-none focus:border-sky-500 w-24 shrink-0 sm:w-44"
              />
              <span
                title={saveErrorMsg || 'Local persistence status'}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono border shrink-0 ${
                  saveStatus === 'saved'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : saveStatus === 'saving'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {saveStatus === 'saved'
                  ? 'Saved'
                  : saveStatus === 'saving'
                  ? 'Saving...'
                  : 'Save Error'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Undo/Redo + Workspace Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
            <button
              type="button"
              aria-label="Undo"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title={`Undo (${
                history[historyIndex]?.label || 'Start'
              })`}
              className="p-1.5 rounded text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[10px] text-zinc-500">
              {historyIndex + 1}/{history.length}
            </span>
            <button
              type="button"
              aria-label="Redo"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
              className="p-1.5 rounded text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden lg:flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setWorkspaceMode('design')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 cursor-pointer ${
                workspaceMode === 'design'
                  ? 'bg-sky-600 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PenTool className="w-3 h-3" />
              <span className="hidden sm:inline">Design</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode('split')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 cursor-pointer ${
                workspaceMode === 'split'
                  ? 'bg-sky-600 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span className="hidden sm:inline">Split Code</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWorkspaceMode('preview');
                setPreviewFeedback(null);
              }}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 cursor-pointer ${
                workspaceMode === 'preview'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>
        </div>

        {/* Right: Project Import / Export / Reset (desktop) + mobile panel
            toggles & overflow menu */}
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUploadImport}
            className="hidden"
          />
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              title="Import & Validate Project JSON"
              className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xl:inline">Import JSON</span>
            </button>
            <button
              type="button"
              onClick={handleExportProjectJSON}
              title="Export Likhara Project JSON"
              className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xl:inline">Save JSON</span>
            </button>
            <button
              type="button"
              onClick={() =>
                commitTree(
                  DEFAULT_LIKHARA_STARTER_TREE,
                  'likhara-hero-card',
                  'Reset to Starter Template'
                )
              }
              title="Reset to Starter Template"
              className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile (< 1024px): canvas-first panel toggles + overflow menu */}
          <div className="flex lg:hidden items-center gap-1">
            <button
              type="button"
              aria-label="Toggle Components panel"
              aria-expanded={mobilePanel === 'left'}
              onClick={() =>
                setMobilePanel(mobilePanel === 'left' ? 'none' : 'left')
              }
              className={`p-2 rounded-md border text-xs flex items-center cursor-pointer ${
                mobilePanel === 'left'
                  ? 'bg-sky-600 border-sky-500 text-white font-medium'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300'
              }`}
            >
              <Box className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Toggle Properties panel"
              aria-expanded={mobilePanel === 'inspector'}
              onClick={() =>
                setMobilePanel(mobilePanel === 'inspector' ? 'none' : 'inspector')
              }
              className={`p-2 rounded-md border text-xs flex items-center cursor-pointer ${
                mobilePanel === 'inspector'
                  ? 'bg-sky-600 border-sky-500 text-white font-medium'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300'
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="More actions"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-md border text-xs flex items-center cursor-pointer ${
                mobileMenuOpen
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden="true"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div
                role="menu"
                aria-label="More actions"
                className="absolute right-2 top-12 z-50 w-60 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/50 py-1.5 max-lg:mr-1"
              >
                <p className="px-3 pt-1 pb-1.5 text-[10px] font-mono uppercase tracking-wide text-zinc-500">
                  Workspace Mode
                </p>
                <div className="flex gap-1 px-2 pb-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setWorkspaceMode('design')}
                    className={`flex-1 px-2 py-2 rounded-md text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      workspaceMode === 'design'
                        ? 'bg-sky-600 text-white font-medium'
                        : 'bg-zinc-950 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    Design
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setWorkspaceMode('split')}
                    className={`flex-1 px-2 py-2 rounded-md text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      workspaceMode === 'split'
                        ? 'bg-sky-600 text-white font-medium'
                        : 'bg-zinc-950 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    Split
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setWorkspaceMode('preview');
                      setPreviewFeedback(null);
                    }}
                    className={`flex-1 px-2 py-2 rounded-md text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      workspaceMode === 'preview'
                        ? 'bg-emerald-600 text-white font-medium'
                        : 'bg-zinc-950 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Preview
                  </button>
                </div>
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-mono uppercase tracking-wide text-zinc-500">
                  Preview Viewport
                </p>
                <div className="flex gap-1 px-2 pb-1.5">
                  {(
                    [
                      ['desktop', 'Desktop', Monitor],
                      ['tablet', 'Tablet', Tablet],
                      ['mobile', 'Phone', Smartphone],
                    ] as const
                  ).map(([mode, label, Icon]) => (
                    <button
                      key={mode}
                      type="button"
                      role="menuitem"
                      onClick={() => setViewportMode(mode)}
                      className={`flex-1 px-2 py-2 rounded-md text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                        viewportMode === mode
                          ? 'bg-zinc-800 text-sky-400 border border-zinc-700'
                          : 'bg-zinc-950 text-zinc-300 border border-zinc-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="my-1 border-t border-zinc-800" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowImportModal(true);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs flex items-center gap-2.5 hover:bg-zinc-800 text-zinc-200 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  Import JSON…
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleExportProjectJSON();
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs flex items-center gap-2.5 hover:bg-zinc-800 text-zinc-200 cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5 text-sky-400" />
                  Save JSON
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    commitTree(
                      DEFAULT_LIKHARA_STARTER_TREE,
                      'likhara-hero-card',
                      'Reset to Starter Template'
                    );
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs flex items-center gap-2.5 hover:bg-zinc-800 text-zinc-200 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  Reset to Starter
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ====================================================================
          IMPORT VALIDATION MODAL (SAFE SCHEMA VALIDATION)
         ==================================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold text-white">
                  Import &amp; Validate Likhara Project JSON
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close import modal"
                onClick={() => setShowImportModal(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Upload a `.json` project file or paste a `LikharaProject` / `UINode` JSON payload below. Invalid schemas are rejected before modifying your current project.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Choose JSON File...
              </button>
            </div>

            <textarea
              rows={6}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{"schemaVersion": 1, "name": "My Project", "root": { ... }}'
              className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
            />

            {importFeedback && importFeedback.type === 'error' && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Schema Validation Failed (Current workspace preserved):
                </div>
                <ul className="list-disc list-inside text-[11px] space-y-0.5">
                  {importFeedback.messages.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApplyValidatedImport(importJsonText)}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white cursor-pointer"
              >
                Validate &amp; Load
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MAIN 3-COLUMN STUDIO BODY (drawers below 1024px, one at a time)
         ==================================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Scrim behind an open mobile drawer */}
        {mobilePanel !== 'none' && (
          <div
            className="hidden max-lg:block absolute inset-0 z-30 bg-black/60"
            aria-hidden="true"
            onClick={() => setMobilePanel('none')}
          />
        )}
        {/* ------------------------------------------------------------------
            LEFT SIDEBAR: COMPONENT PALETTE & DOM LAYER TREE
           ------------------------------------------------------------------ */}
        <aside
          className={`w-64 shrink-0 border-r border-zinc-800 bg-zinc-900/70 flex flex-col overflow-hidden max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:w-[85vw] max-lg:max-w-[380px] max-lg:bg-zinc-900 max-lg:shadow-2xl max-lg:transition-transform max-lg:duration-200 ${
            mobilePanel === 'left'
              ? 'max-lg:translate-x-0'
              : 'max-lg:-translate-x-full'
          }`}
        >
          <div className="flex items-stretch border-b border-zinc-800 bg-zinc-900">
            <div className="grid grid-cols-2 flex-1 p-2 gap-1 min-w-0">
            <button
              type="button"
              onClick={() => setLeftTab('palette')}
              className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                leftTab === 'palette'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-sky-400" />
              Components
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('layers')}
              className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                leftTab === 'layers'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Layers ({totalNodes})
            </button>
            </div>
            <button
              type="button"
              aria-label="Close panel"
              onClick={() => setMobilePanel('none')}
              className="hidden max-lg:flex items-center px-3 border-l border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {leftTab === 'palette' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Placement Mode Selector for Touch/Click Insertion */}
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5">
                <span className="block text-[10px] font-mono uppercase text-zinc-400">
                  Quick-Insert Placement
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {(['inside', 'before', 'after'] as DropPosition[]).map(
                    (pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setInsertMode(pos)}
                        className={`py-1 rounded text-[10px] font-mono capitalize border cursor-pointer ${
                          insertMode === pos
                            ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {pos}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Containers */}
              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Layout Containers
                  </span>
                  <span className="text-[10px] text-zinc-500">Drag or +</span>
                </div>
                <div className="space-y-1.5">
                  {PALETTE_DEFINITIONS.filter(
                    (d) => d.category === 'container'
                  ).map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handlePaletteDragStart(e, item.type)}
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-200 truncate">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {item.description}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Insert ${item.label}`}
                        onClick={() => handleInsertPrimitive(item.type)}
                        className="p-1.5 rounded bg-zinc-800 hover:bg-sky-600 text-zinc-300 hover:text-white cursor-pointer shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic Elements */}
              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Semantic Elements
                  </span>
                  <span className="text-[10px] text-zinc-500">Drag or +</span>
                </div>
                <div className="space-y-1.5">
                  {PALETTE_DEFINITIONS.filter(
                    (d) => d.category === 'element'
                  ).map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handlePaletteDragStart(e, item.type)}
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-200 truncate">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {item.description}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Insert ${item.label}`}
                        onClick={() => handleInsertPrimitive(item.type)}
                        className="p-1.5 rounded bg-zinc-800 hover:bg-sky-600 text-zinc-300 hover:text-white cursor-pointer shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {leftTab === 'layers' && (
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              {renderLayerNode(liveRoot)}
            </div>
          )}
        </aside>

        {/* ------------------------------------------------------------------
            CENTER WORKSPACE: CANVAS + LIVE COMPILER DRAWER
           ------------------------------------------------------------------ */}
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          {/* Canvas Toolbar */}
          <div className="h-9 shrink-0 px-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between gap-3 text-xs max-lg:overflow-x-auto max-lg:whitespace-nowrap max-lg:[&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-[11px] text-sky-400">
                Selection:
              </span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-medium truncate">
                {selectedNode.name} (&lt;{selectedNode.tag}&gt;)
              </span>
              <span className="hidden md:inline font-mono text-[10px] text-zinc-500">
                W: {selectedNode.style.width} • H: {selectedNode.style.height} •
                Opacity: {selectedNode.style.opacity}%
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="Toggle canvas grid"
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1 rounded border cursor-pointer ${
                  showGrid
                    ? 'bg-zinc-800 border-zinc-700 text-sky-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => setCanvasZoom((z) => Math.max(50, z - 10))}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] text-zinc-300 w-9 text-center">
                  {canvasZoom}%
                </span>
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => setCanvasZoom((z) => Math.min(150, z + 10))}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded p-0.5">
                <button
                  type="button"
                  aria-label="Desktop viewport"
                  onClick={() => setViewportMode('desktop')}
                  className={`p-1 rounded cursor-pointer ${
                    viewportMode === 'desktop'
                      ? 'bg-zinc-800 text-sky-400'
                      : 'text-zinc-500'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Tablet viewport"
                  onClick={() => setViewportMode('tablet')}
                  className={`p-1 rounded cursor-pointer ${
                    viewportMode === 'tablet'
                      ? 'bg-zinc-800 text-sky-400'
                      : 'text-zinc-500'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Mobile viewport"
                  onClick={() => setViewportMode('mobile')}
                  className={`p-1 rounded cursor-pointer ${
                    viewportMode === 'mobile'
                      ? 'bg-zinc-800 text-sky-400'
                      : 'text-zinc-500'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Preview Interaction Banner */}
          {isPreviewMode && previewFeedback && (
            <div className="px-4 py-1.5 bg-emerald-950/80 border-b border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between">
              <span>{previewFeedback}</span>
              <button
                type="button"
                onClick={() => setPreviewFeedback(null)}
                className="text-[10px] underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Interactive Canvas Surface */}
          <div
            onClick={() => !isPreviewMode && setSelectedId('root')}
            className={`${
              workspaceMode === 'split' ? 'h-[58%]' : 'flex-1'
            } overflow-auto p-8 flex justify-center items-start border-b border-zinc-800 ${
              showGrid
                ? 'bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:18px_18px]'
                : 'bg-zinc-950'
            }`}
          >
            <div
              style={{
                transform: `scale(${canvasZoom / 100})`,
                transformOrigin: 'top center',
              }}
              className={`transition-all duration-150 ${
                viewportMode === 'mobile'
                  ? 'w-[390px]'
                  : viewportMode === 'tablet'
                  ? 'w-[768px]'
                  : 'w-full max-w-4xl'
              }`}
            >
              {renderCanvasNode(liveRoot)}
            </div>
          </div>

          {/* Live Code Compiler & Diagnostics Drawer */}
          {workspaceMode === 'split' && (
            <div className="h-[42%] flex flex-col overflow-hidden bg-[#070709]">
              <div className="h-9 shrink-0 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 max-lg:overflow-x-auto max-lg:whitespace-nowrap max-lg:[&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                <div className="flex items-center gap-2 shrink-0">
                  <FileCode className="w-3.5 h-3.5 text-sky-400" />
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded p-0.5 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setCodeFormat('react-tw')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        codeFormat === 'react-tw'
                          ? 'bg-sky-600 text-white'
                          : 'text-zinc-400'
                      }`}
                    >
                      React + Tailwind (.tsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeFormat('react-inline')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        codeFormat === 'react-inline'
                          ? 'bg-sky-600 text-white'
                          : 'text-zinc-400'
                      }`}
                    >
                      React Inline (.tsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeFormat('html')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        codeFormat === 'html'
                          ? 'bg-sky-600 text-white'
                          : 'text-zinc-400'
                      }`}
                    >
                      Standalone HTML (.html)
                    </button>
                  </div>

                  {exportDiagnostics.length === 0 ? (
                    <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />0 Semantic Warnings
                    </span>
                  ) : (
                    <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      {exportDiagnostics.length} Diagnostic(s)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadCode}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer ${
                      copiedCode
                        ? 'bg-emerald-600 text-white'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                    }`}
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-3.5 font-mono text-xs leading-relaxed text-zinc-200 select-text">
                <pre className="whitespace-pre">{compiledCode}</pre>
              </div>
            </div>
          )}
        </main>

        {/* ------------------------------------------------------------------
            RIGHT SIDEBAR: LIKHARA PROPERTY & SEMANTICS INSPECTOR
           ------------------------------------------------------------------ */}
        <aside
          className={`w-80 shrink-0 border-l border-zinc-800 bg-zinc-900/80 flex flex-col overflow-hidden max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-40 max-lg:w-[85vw] max-lg:max-w-[380px] max-lg:bg-zinc-900 max-lg:shadow-2xl max-lg:transition-transform max-lg:duration-200 ${
            mobilePanel === 'inspector'
              ? 'max-lg:translate-x-0'
              : 'max-lg:translate-x-full'
          }`}
        >
          <div className="p-3 border-b border-zinc-800 bg-zinc-900 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sliders className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate">
                  {selectedNode.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-zinc-800 text-sky-300 border border-zinc-700">
                  &lt;{selectedNode.tag}&gt;
                </span>
                <button
                  type="button"
                  aria-label="Close panel"
                  onClick={() => setMobilePanel('none')}
                  className="hidden max-lg:flex p-1.5 -mr-1 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => setInspectorTab('style')}
                className={`py-1 rounded text-xs font-medium cursor-pointer ${
                  inspectorTab === 'style'
                    ? 'bg-sky-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Style &amp; Opacity
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('semantics')}
                className={`py-1 rounded text-xs font-medium cursor-pointer ${
                  inspectorTab === 'semantics'
                    ? 'bg-sky-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Semantics &amp; Props
              </button>
            </div>
          </div>

          {selectedNode.locked ? (
            <div className="p-6 text-center space-y-3">
              <Lock className="w-7 h-7 text-amber-400 mx-auto" />
              <div className="text-xs font-semibold text-white">
                Layer is Locked
              </div>
              <p className="text-[11px] text-zinc-400">
                Unlock this layer to edit its opacity, color channels, or semantic attributes.
              </p>
              <button
                type="button"
                onClick={() => handleToggleNodeFlag(selectedNode.id, 'locked')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium cursor-pointer"
              >
                Unlock Element
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
              {/* ============================================================
                  INSPECTOR TAB 1: OPACITY, RGBA COLOR PICKERS & BOX MODEL
                 ============================================================ */}
              {inspectorTab === 'style' && (
                <>
                  {/* MASTER ELEMENT OPACITY SLIDER (0% - 100%) */}
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        Master Opacity
                      </span>
                      <span className="font-mono text-xs font-bold text-sky-300">
                        {selectedNode.style.opacity}%
                      </span>
                    </div>

                    <input
                      type="range"
                      aria-label="Master element opacity"
                      min={0}
                      max={100}
                      step={1}
                      value={selectedNode.style.opacity}
                      onPointerDown={beginGestureTransaction}
                      onChange={(e) =>
                        updateSelectedStyleLive({
                          opacity: Number(e.target.value),
                        })
                      }
                      onPointerUp={() =>
                        endGestureTransaction('Adjust Element Opacity')
                      }
                      onKeyUp={() =>
                        endGestureTransaction('Adjust Element Opacity')
                      }
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 bg-zinc-800"
                    />

                    <div className="grid grid-cols-5 gap-1">
                      {[10, 25, 50, 75, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            updateSelectedStyleDiscrete(
                              { opacity: val },
                              `Set Opacity ${val}%`
                            )
                          }
                          className={`py-1 rounded text-[10px] font-mono border cursor-pointer ${
                            selectedNode.style.opacity === val
                              ? 'bg-sky-500/25 border-sky-500 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* BACKGROUND COLOR + ALPHA TRANSPARENCY */}
                  {selectedNode.tag !== 'hr' && (
                    <ColorAlphaControl
                      label="Background Fill"
                      hexColor={selectedNode.style.bgColor}
                      alphaPercent={selectedNode.style.bgAlpha}
                      onGestureStart={beginGestureTransaction}
                      onLiveChange={({ hex, alpha }) =>
                        updateSelectedStyleLive({
                          ...(hex !== undefined ? { bgColor: hex } : {}),
                          ...(alpha !== undefined ? { bgAlpha: alpha } : {}),
                        })
                      }
                      onGestureCommit={endGestureTransaction}
                      allowClear
                    />
                  )}

                  {/* TEXT COLOR + ALPHA TRANSPARENCY */}
                  {selectedNode.tag !== 'hr' && selectedNode.tag !== 'img' && (
                    <ColorAlphaControl
                      label="Text Color"
                      hexColor={selectedNode.style.textColor}
                      alphaPercent={selectedNode.style.textAlpha}
                      onGestureStart={beginGestureTransaction}
                      onLiveChange={({ hex, alpha }) =>
                        updateSelectedStyleLive({
                          ...(hex !== undefined ? { textColor: hex } : {}),
                          ...(alpha !== undefined ? { textAlpha: alpha } : {}),
                        })
                      }
                      onGestureCommit={endGestureTransaction}
                      allowClear={false}
                    />
                  )}

                  {/* BORDER COLOR + ALPHA + WIDTH */}
                  <ColorAlphaControl
                    label="Border Stroke"
                    hexColor={selectedNode.style.borderColor}
                    alphaPercent={selectedNode.style.borderAlpha}
                    onGestureStart={beginGestureTransaction}
                    onLiveChange={({ hex, alpha }) =>
                      updateSelectedStyleLive({
                        ...(hex !== undefined ? { borderColor: hex } : {}),
                        ...(alpha !== undefined ? { borderAlpha: alpha } : {}),
                      })
                    }
                    onGestureCommit={endGestureTransaction}
                    allowClear
                  />

                  {/* DIMENSIONS, PADDING, GAP & RADIUS */}
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/90 space-y-3">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                      Dimensions &amp; Box Model
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          Width
                        </label>
                        <input
                          type="text"
                          aria-label="Element width"
                          value={selectedNode.style.width}
                          onFocus={beginGestureTransaction}
                          onChange={(e) =>
                            updateSelectedStyleLive({ width: e.target.value })
                          }
                          onBlur={() => endGestureTransaction('Change Width')}
                          className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          Height
                        </label>
                        <input
                          type="text"
                          aria-label="Element height"
                          value={selectedNode.style.height}
                          onFocus={beginGestureTransaction}
                          onChange={(e) =>
                            updateSelectedStyleLive({ height: e.target.value })
                          }
                          onBlur={() => endGestureTransaction('Change Height')}
                          className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {(['100%', 'fit-content', 'auto'] as const).map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() =>
                            updateSelectedStyleDiscrete(
                              { width: w },
                              `Set Width ${w}`
                            )
                          }
                          className={`py-1 rounded text-[10px] font-mono border cursor-pointer ${
                            selectedNode.style.width === w
                              ? 'bg-sky-500/25 border-sky-500 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>

                    {/* Padding X / Y */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Padding X</span>
                        <span className="font-mono text-zinc-200">
                          {selectedNode.style.paddingX}px
                        </span>
                      </div>
                      <input
                        type="range"
                        aria-label="Horizontal padding"
                        min={0}
                        max={64}
                        step={2}
                        value={selectedNode.style.paddingX}
                        onPointerDown={beginGestureTransaction}
                        onChange={(e) =>
                          updateSelectedStyleLive({
                            paddingX: Number(e.target.value),
                          })
                        }
                        onPointerUp={() =>
                          endGestureTransaction('Adjust Padding X')
                        }
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 bg-zinc-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Padding Y</span>
                        <span className="font-mono text-zinc-200">
                          {selectedNode.style.paddingY}px
                        </span>
                      </div>
                      <input
                        type="range"
                        aria-label="Vertical padding"
                        min={0}
                        max={64}
                        step={2}
                        value={selectedNode.style.paddingY}
                        onPointerDown={beginGestureTransaction}
                        onChange={(e) =>
                          updateSelectedStyleLive({
                            paddingY: Number(e.target.value),
                          })
                        }
                        onPointerUp={() =>
                          endGestureTransaction('Adjust Padding Y')
                        }
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 bg-zinc-800"
                      />
                    </div>

                    {selectedNode.isContainer && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-400">Container Gap</span>
                          <span className="font-mono text-zinc-200">
                            {selectedNode.style.gap}px
                          </span>
                        </div>
                        <input
                          type="range"
                          aria-label="Container gap"
                          min={0}
                          max={48}
                          step={2}
                          value={selectedNode.style.gap}
                          onPointerDown={beginGestureTransaction}
                          onChange={(e) =>
                            updateSelectedStyleLive({
                              gap: Number(e.target.value),
                            })
                          }
                          onPointerUp={() =>
                            endGestureTransaction('Adjust Gap')
                          }
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 bg-zinc-800"
                        />
                      </div>
                    )}

                    {/* Border Width & Radius */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Border Width</span>
                        <span className="font-mono text-zinc-200">
                          {selectedNode.style.borderWidth}px
                        </span>
                      </div>
                      <input
                        type="range"
                        aria-label="Border width"
                        min={0}
                        max={8}
                        step={1}
                        value={selectedNode.style.borderWidth}
                        onPointerDown={beginGestureTransaction}
                        onChange={(e) =>
                          updateSelectedStyleLive({
                            borderWidth: Number(e.target.value),
                          })
                        }
                        onPointerUp={() =>
                          endGestureTransaction('Adjust Border Width')
                        }
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 bg-zinc-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Corner Radius</span>
                        <span className="font-mono text-zinc-200">
                          {selectedNode.style.borderRadius >= 48
                            ? 'Pill'
                            : `${selectedNode.style.borderRadius}px`}
                        </span>
                      </div>
                      <input
                        type="range"
                        aria-label="Corner radius"
                        min={0}
                        max={48}
                        step={2}
                        value={selectedNode.style.borderRadius}
                        onPointerDown={beginGestureTransaction}
                        onChange={(e) =>
                          updateSelectedStyleLive({
                            borderRadius: Number(e.target.value),
                          })
                        }
                        onPointerUp={() =>
                          endGestureTransaction('Adjust Corner Radius')
                        }
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 bg-zinc-800"
                      />
                    </div>
                  </div>

                  {/* CONTAINER FLEX/GRID CONTROLS */}
                  {selectedNode.isContainer && (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/90 space-y-2.5">
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                        Container Layout
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        {(
                          [
                            {
                              label: 'Flex Column',
                              display: 'flex',
                              dir: 'column',
                            },
                            { label: 'Flex Row', display: 'flex', dir: 'row' },
                            {
                              label: '2-Col Grid',
                              display: 'grid-2',
                              dir: 'column',
                            },
                            {
                              label: '3-Col Grid',
                              display: 'grid-3',
                              dir: 'column',
                            },
                          ] as const
                        ).map((preset) => {
                          const active =
                            selectedNode.style.display === preset.display &&
                            (preset.display !== 'flex' ||
                              selectedNode.style.flexDirection === preset.dir);
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() =>
                                updateSelectedStyleDiscrete(
                                  {
                                    display: preset.display,
                                    flexDirection: preset.dir,
                                  },
                                  `Set Layout ${preset.label}`
                                )
                              }
                              className={`py-1.5 rounded text-[10px] font-mono border cursor-pointer ${
                                active
                                  ? 'bg-sky-500/25 border-sky-500 text-white'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TYPOGRAPHY */}
                  {selectedNode.tag !== 'hr' && selectedNode.tag !== 'img' && (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/90 space-y-2.5">
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                        Typography
                      </span>
                      <div className="grid grid-cols-4 gap-1">
                        {(
                          [
                            'xs',
                            'sm',
                            'base',
                            'lg',
                            'xl',
                            '2xl',
                            '3xl',
                            '4xl',
                          ] as FontSizeToken[]
                        ).map((fs) => (
                          <button
                            key={fs}
                            type="button"
                            onClick={() =>
                              updateSelectedStyleDiscrete(
                                { fontSize: fs },
                                `Font Size ${fs}`
                              )
                            }
                            className={`py-1 rounded text-[10px] font-mono border cursor-pointer ${
                              selectedNode.style.fontSize === fs
                                ? 'bg-sky-500/25 border-sky-500 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {fs}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {(
                          [
                            'normal',
                            'medium',
                            'semibold',
                            'bold',
                            'extrabold',
                          ] as FontWeightToken[]
                        ).map((fw) => (
                          <button
                            key={fw}
                            type="button"
                            onClick={() =>
                              updateSelectedStyleDiscrete(
                                { fontWeight: fw },
                                `Font Weight ${fw}`
                              )
                            }
                            className={`py-1 rounded text-[10px] font-mono border cursor-pointer ${
                              selectedNode.style.fontWeight === fw
                                ? 'bg-sky-500/25 border-sky-500 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {fw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ============================================================
                  INSPECTOR TAB 2: SEMANTIC ATTRIBUTES & BEHAVIORAL PROPS
                 ============================================================ */}
              {inspectorTab === 'semantics' && (
                <div className="space-y-3.5">
                  {/* Layer Name & HTML Tag */}
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                        Layer Name
                      </label>
                      <input
                        type="text"
                        aria-label="Layer Name"
                        value={selectedNode.name}
                        onFocus={beginGestureTransaction}
                        onChange={(e) =>
                          updateSelectedLive((n) => ({
                            ...n,
                            name: e.target.value,
                          }))
                        }
                        onBlur={() => endGestureTransaction('Rename Layer')}
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                        Semantic HTML Tag
                      </label>
                      <select
                        aria-label="Semantic HTML Tag"
                        value={selectedNode.tag}
                        onChange={(e) =>
                          updateSelectedDiscrete(
                            (n) => ({ ...n, tag: e.target.value as UITag }),
                            `Change Tag to <${e.target.value}>`
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-100"
                      >
                        {ALLOWED_UI_TAGS.map((t) => (
                          <option key={t} value={t}>
                            &lt;{t}&gt;
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Text Content */}
                  {!selectedNode.isContainer &&
                    selectedNode.tag !== 'input' &&
                    selectedNode.tag !== 'textarea' &&
                    selectedNode.tag !== 'img' &&
                    selectedNode.tag !== 'hr' && (
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5">
                        <label className="block text-[10px] font-mono uppercase text-zinc-400">
                          Text Content
                        </label>
                        <textarea
                          rows={3}
                          aria-label="Element text content"
                          value={selectedNode.text || ''}
                          onFocus={beginGestureTransaction}
                          onChange={(e) =>
                            updateSelectedLive((n) => ({
                              ...n,
                              text: e.target.value,
                            }))
                          }
                          onBlur={() => endGestureTransaction('Edit Text')}
                          className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                    )}

                  {/* Anchor Link Semantics */}
                  {selectedNode.tag === 'a' && (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
                      <span className="block text-[10px] font-mono uppercase text-sky-400">
                        Link Semantics (&lt;a&gt;)
                      </span>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          Destination URL (href)
                        </label>
                        <input
                          type="url"
                          aria-label="Link href destination"
                          value={selectedNode.href || ''}
                          onFocus={beginGestureTransaction}
                          onChange={(e) =>
                            updateSelectedLive((n) => ({
                              ...n,
                              href: e.target.value,
                            }))
                          }
                          onBlur={() => endGestureTransaction('Set Link Href')}
                          placeholder="https://..."
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-100"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedNode.targetBlank)}
                          onChange={(e) =>
                            updateSelectedDiscrete(
                              (n) => ({
                                ...n,
                                targetBlank: e.target.checked,
                              }),
                              'Toggle Link Target Blank'
                            )
                          }
                        />
                        Open in new tab (`target="_blank"`)
                      </label>
                    </div>
                  )}

                  {/* Button Action Semantics */}
                  {selectedNode.tag === 'button' && (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
                      <span className="block text-[10px] font-mono uppercase text-sky-400">
                        Button Action Behavior
                      </span>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          Action Type
                        </label>
                        <select
                          aria-label="Button action type"
                          value={selectedNode.actionType || 'none'}
                          onChange={(e) =>
                            updateSelectedDiscrete(
                              (n) => ({
                                ...n,
                                actionType: e.target.value as ButtonActionType,
                              }),
                              'Change Button Action'
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        >
                          <option value="none">None (Standard Button)</option>
                          <option value="submit">Submit Parent Form</option>
                          <option value="navigate">Navigate to URL</option>
                          <option value="custom-event">
                            Dispatch CustomEvent
                          </option>
                        </select>
                      </div>
                      {(selectedNode.actionType === 'navigate' ||
                        selectedNode.actionType === 'custom-event') && (
                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-1">
                            {selectedNode.actionType === 'navigate'
                              ? 'Destination URL'
                              : 'Custom Event Name'}
                          </label>
                          <input
                            type="text"
                            aria-label="Button action target"
                            value={selectedNode.actionTarget || ''}
                            onFocus={beginGestureTransaction}
                            onChange={(e) =>
                              updateSelectedLive((n) => ({
                                ...n,
                                actionTarget: e.target.value,
                              }))
                            }
                            onBlur={() =>
                              endGestureTransaction('Set Button Action Target')
                            }
                            placeholder={
                              selectedNode.actionType === 'navigate'
                                ? 'https://example.com'
                                : 'likhara:action'
                            }
                            className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-100"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Input / Textarea Semantics */}
                  {(selectedNode.tag === 'input' ||
                    selectedNode.tag === 'textarea') && (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
                      <span className="block text-[10px] font-mono uppercase text-sky-400">
                        Form Control Attributes
                      </span>
                      {selectedNode.tag === 'input' && (
                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-1">
                            Input Type
                          </label>
                          <select
                            aria-label="Input type"
                            value={selectedNode.inputType || 'text'}
                            onChange={(e) =>
                              updateSelectedDiscrete(
                                (n) => ({
                                  ...n,
                                  inputType: e.target.value as InputFieldType,
                                }),
                                'Set Input Type'
                              )
                            }
                            className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                          >
                            <option value="text">text</option>
                            <option value="email">email</option>
                            <option value="password">password</option>
                            <option value="number">number</option>
                            <option value="search">search</option>
                            <option value="tel">tel</option>
                            <option value="url">url</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          Field Name (`name`)
                        </label>
                        <input
                          type="text"
                          aria-label="Form field name"
                          value={selectedNode.nameAttr || ''}
                          onFocus={beginGestureTransaction}
                          onChange={(e) =>
                            updateSelectedLive((n) => ({
                              ...n,
                              nameAttr: e.target.value,
                            }))
                          }
                          onBlur={() =>
                            endGestureTransaction('Set Field Name Attribute')
                          }
                          placeholder="e.g. user_email"
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          aria-label="Form field placeholder"
                          value={selectedNode.placeholder || ''}
                          onFocus={beginGestureTransaction}
                          onChange={(e) =>
                            updateSelectedLive((n) => ({
                              ...n,
                              placeholder: e.target.value,
                            }))
                          }
                          onBlur={() =>
                            endGestureTransaction('Set Placeholder')
                          }
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedNode.required)}
                          onChange={(e) =>
                            updateSelectedDiscrete(
                              (n) => ({ ...n, required: e.target.checked }),
                              'Toggle Required Field'
                            )
                          }
                        />
                        Required field (`required`)
                      </label>
                    </div>
                  )}

                  {/* Image Semantics */}
                  {selectedNode.tag === 'img' && (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
                      <span className="block text-[10px] font-mono uppercase text-sky-400">
                        Image Attributes (&lt;img&gt;)
                      </span>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          Image Source URL (`src`)
                        </label>
                        <input
                          type="url"
                          aria-label="Image source URL"
                          value={selectedNode.src || ''}
                          onFocus={beginGestureTransaction}
                          onChange={(e) =>
                            updateSelectedLive((n) => ({
                              ...n,
                              src: e.target.value,
                            }))
                          }
                          onBlur={() => endGestureTransaction('Set Image Src')}
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          Alt Text (`alt`)
                        </label>
                        <input
                          type="text"
                          aria-label="Image alt text"
                          value={selectedNode.alt || ''}
                          onFocus={beginGestureTransaction}
                          onChange={(e) =>
                            updateSelectedLive((n) => ({
                              ...n,
                              alt: e.target.value,
                            }))
                          }
                          onBlur={() => endGestureTransaction('Set Image Alt')}
                          placeholder="Describe the image..."
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                    </div>
                  )}

                  {/* Accessibility & Custom Tailwind Utilities */}
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                        Accessible Label (`aria-label`)
                      </label>
                      <input
                        type="text"
                        aria-label="Element aria-label"
                        value={selectedNode.ariaLabel || ''}
                        onFocus={beginGestureTransaction}
                        onChange={(e) =>
                          updateSelectedLive((n) => ({
                            ...n,
                            ariaLabel: e.target.value,
                          }))
                        }
                        onBlur={() => endGestureTransaction('Set Aria Label')}
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                        Custom Tailwind Classes
                      </label>
                      <input
                        type="text"
                        aria-label="Custom Tailwind classes"
                        value={selectedNode.style.customClass}
                        onFocus={beginGestureTransaction}
                        onChange={(e) =>
                          updateSelectedStyleLive({
                            customClass: e.target.value,
                          })
                        }
                        onBlur={() =>
                          endGestureTransaction('Edit Custom Classes')
                        }
                        placeholder="e.g. tracking-tight overflow-hidden"
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-emerald-300"
                      />
                    </div>
                  </div>

                  {/* Selected Node Export Diagnostics */}
                  {selectedNodeDiagnostics.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1">
                      <span className="block text-[10px] font-mono uppercase text-amber-300">
                        Export Fidelity Diagnostics
                      </span>
                      {selectedNodeDiagnostics.map((d, i) => (
                        <p key={i} className="text-[11px] text-amber-200">
                          • {d.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}