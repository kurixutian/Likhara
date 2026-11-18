import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Plus,
  Upload,
  Download,
  Trash2,
  Copy,
  Pencil,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { LikharaProject } from './likhara/core';
import {
  listProjects,
  getProject,
  saveProjectRecord,
  deleteProjectRecord,
} from './likhara/projects/storage';
import {
  createProject,
  duplicateProject,
  parseProjectDocument,
} from './likhara/projects/projectOps';
import { runLegacyMigration } from './likhara/projects/migration';
import type { MigrationOutcome } from './likhara/projects/migration';

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(iso).toLocaleDateString();
}

function downloadProjectDoc(project: LikharaProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') || 'likhara-project'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ProjectHome({
  onOpenProject,
}: {
  onOpenProject: (project: LikharaProject) => void;
}) {
  const [projects, setProjects] = useState<LikharaProject[]>([]);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [migration, setMigration] = useState<MigrationOutcome | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    messages: string[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      const all = await listProjects();
      setProjects(all);
      setStorageError(null);
      setPhase('ready');
    } catch (err) {
      setStorageError(err instanceof Error ? err.message : 'Storage failure');
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const outcome = await runLegacyMigration();
      if (cancelled) return;
      setMigration(outcome);
      await refreshProjects();
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshProjects]);

  const withBusy = useCallback(
    async (action: () => Promise<void>) => {
      if (busy) return;
      setBusy(true);
      setFeedback(null);
      try {
        await action();
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  const handleNewProject = () =>
    withBusy(async () => {
      const project = createProject();
      const save = await saveProjectRecord(project);
      if (!save.ok) {
        setFeedback({ type: 'error', messages: [save.error] });
        return;
      }
      onOpenProject(project);
    });

  const handleOpenProject = (project: LikharaProject) =>
    withBusy(async () => {
      // Re-read from storage so the editor always opens the persisted truth.
      const stored = await getProject(project.id);
      if (stored) onOpenProject(stored);
      else {
        setFeedback({
          type: 'error',
          messages: [`Project "${project.name}" could not be loaded.`],
        });
      }
    });

  const handleRename = (project: LikharaProject) =>
    withBusy(async () => {
      const name = window.prompt('Rename project', project.name);
      if (name === null || !name.trim() || name.trim() === project.name) return;
      const updated: LikharaProject = {
        ...project,
        name: name.trim(),
        updatedAt: new Date().toISOString(),
      };
      const save = await saveProjectRecord(updated);
      if (!save.ok) {
        setFeedback({ type: 'error', messages: [save.error] });
        return;
      }
      await refreshProjects();
      setFeedback({ type: 'success', messages: [`Renamed to "${updated.name}".`] });
    });

  const handleDuplicate = (project: LikharaProject) =>
    withBusy(async () => {
      const copy = duplicateProject(project);
      const save = await saveProjectRecord(copy);
      if (!save.ok) {
        setFeedback({ type: 'error', messages: [save.error] });
        return;
      }
      await refreshProjects();
      setFeedback({ type: 'success', messages: [`Created "${copy.name}".`] });
    });

  const handleDelete = (project: LikharaProject) =>
    withBusy(async () => {
      if (
        !window.confirm(
          `Delete project "${project.name}"? Its design tree will be permanently removed. This cannot be undone.`
        )
      )
        return;
      const del = await deleteProjectRecord(project.id);
      if (!del.ok) {
        setFeedback({ type: 'error', messages: [del.error] });
        return;
      }
      await refreshProjects();
      setFeedback({ type: 'success', messages: [`Deleted "${project.name}".`] });
    });

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      withBusy(async () => {
        if (typeof reader.result !== 'string') return;
        const result = parseProjectDocument(
          reader.result,
          projects.map((p) => p.id)
        );
        if (!result.ok) {
          setFeedback({ type: 'error', messages: result.errors });
          return;
        }
        const save = await saveProjectRecord(result.project);
        if (!save.ok) {
          setFeedback({ type: 'error', messages: [save.error] });
          return;
        }
        await refreshProjects();
        setFeedback({
          type: 'success',
          messages: [
            result.renamedDueToCollision
              ? `Imported as "${result.project.name}" (a project with the same id already existed, so a new id was assigned).`
              : `Imported "${result.project.name}".`,
          ],
        });
      });
    reader.onerror = () =>
      setFeedback({ type: 'error', messages: ['Could not read the file.'] });
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 bg-zinc-900 px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-md bg-sky-600 flex items-center justify-center text-white font-bold text-[10px] tracking-wider shrink-0">
            LK
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-zinc-100 truncate">
              Likhara Studio
            </h1>
            <p className="hidden sm:block text-[11px] text-zinc-400 truncate">
              Visual UI builder · projects stored locally on this device
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 disabled:opacity-40 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Project</span>
            <span className="sm:hidden">Import</span>
          </button>
          <button
            type="button"
            onClick={handleNewProject}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-md bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportFile}
          aria-hidden="true"
        />
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Storage failure — recoverable */}
        {phase === 'error' && storageError && (
          <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-4 space-y-2">
            <p className="text-sm font-medium text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Projects could not be loaded
            </p>
            <p className="text-xs text-rose-300 font-mono">{storageError}</p>
            <button
              type="button"
              onClick={refreshProjects}
              className="px-3 py-1.5 rounded-md bg-rose-900/60 border border-rose-500/50 text-xs font-medium text-rose-100 hover:bg-rose-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Migration outcomes */}
        {migration && migration.status === 'done' && migration.imported > 0 && (
          <div role="status" className="rounded-lg border border-sky-500/40 bg-sky-950/40 p-4 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-300 mt-0.5 shrink-0" />
            <p className="text-xs text-sky-200">
              Imported {migration.imported} legacy workspace
              {migration.imported > 1 ? 's' : ''} into your project list. The
              original local data was kept untouched.
              {migration.conflict
                ? ' Note: both a Likhara and a Canvix workspace were found with different designs, so both were imported as separate projects.'
                : ''}
            </p>
          </div>
        )}
        {migration && migration.status === 'failed' && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/40 p-4 space-y-2">
            <p className="text-sm font-medium text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Legacy migration did not complete
            </p>
            <p className="text-xs text-amber-300 font-mono">{migration.error}</p>
            <p className="text-xs text-amber-200/80">
              Your original workspace data is preserved. Fix the issue and
              reload this page to retry.
            </p>
          </div>
        )}

        {/* Action feedback */}
        {feedback && (
          <div
            role={feedback.type === 'error' ? 'alert' : 'status'}
            className={`rounded-lg border p-3 flex items-start justify-between gap-2 ${
              feedback.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/30'
                : 'border-rose-500/40 bg-rose-950/40'
            }`}
          >
            <p
              className={`text-xs ${
                feedback.type === 'success'
                  ? 'text-emerald-200'
                  : 'text-rose-200'
              }`}
            >
              {feedback.messages.join(' ')}
            </p>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setFeedback(null)}
              className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {phase === 'ready' && projects.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-100">Projects</h2>
            <p className="text-xs text-zinc-500 mt-0.5 mb-4">
              {projects.length} project{projects.length === 1 ? '' : 's'} on
              this device
            </p>
            <ul className="space-y-2">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => handleOpenProject(project)}
                        disabled={busy}
                        className="text-sm font-semibold text-zinc-100 hover:text-sky-300 text-left disabled:opacity-40 cursor-pointer"
                        title="Open project in editor"
                      >
                        {project.name}
                      </button>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                          &lt;{project.viewport.mode}&gt;
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          Edited {formatRelativeTime(project.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 justify-end">
                      <button
                        type="button"
                        aria-label={`Open ${project.name}`}
                        onClick={() => handleOpenProject(project)}
                        disabled={busy}
                        className="px-3 py-2 rounded-md bg-sky-600/90 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-40 cursor-pointer"
                      >
                        Open
                      </button>
                      <div className="flex items-center">
                        <button
                          type="button"
                          aria-label={`Rename ${project.name}`}
                          title="Rename"
                          onClick={() => handleRename(project)}
                          disabled={busy}
                          className="w-10 h-10 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Duplicate ${project.name}`}
                          title="Duplicate"
                          onClick={() => handleDuplicate(project)}
                          disabled={busy}
                          className="w-10 h-10 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Export ${project.name} as file`}
                          title="Export project file"
                          onClick={() => downloadProjectDoc(project)}
                          disabled={busy}
                          className="w-10 h-10 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label={`Delete ${project.name}`}
                        title="Delete project"
                        onClick={() => handleDelete(project)}
                        disabled={busy}
                        className="w-10 h-10 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-md text-zinc-400 hover:bg-rose-950 hover:text-rose-300 disabled:opacity-40 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {phase === 'loading' && (
          <p className="text-sm text-zinc-400 py-12 text-center" role="status">
            Loading projects…
          </p>
        )}

        {phase === 'ready' && projects.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 py-16 px-6 text-center space-y-3">
            <FileJson className="w-8 h-8 text-zinc-600 mx-auto" />
            <h2 className="text-sm font-semibold text-zinc-200">
              No projects yet
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Create your first project to open the visual editor, or import a
              previously exported Likhara project file.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleNewProject}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Project
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Import Project
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
