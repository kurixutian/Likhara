// End-to-end component flows through the real App (jsdom + fake-indexeddb).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from '../App';
import { getProject, listProjects } from '../likhara/projects/storage';
import { createProject } from '../likhara/projects/projectOps';
import { saveProjectRecord } from '../likhara/projects/storage';
import { parseProjectDocument } from '../likhara/projects/projectOps';
import { compileToStandaloneHTML } from '../likhara/core';

let container: HTMLDivElement;
let root: Root;

async function renderApp() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<App />);
  });
  // Let the home screen's async load effect (migration + list) settle.
  await settle(150);
}

async function clickButton(label: string | RegExp) {
  const button = Array.from(container.querySelectorAll('button')).find(
    (b) =>
      b.getAttribute('aria-label') === label ||
      (typeof label === 'string'
        ? b.textContent?.trim() === label
        : label.test(b.textContent?.trim() || ''))
  );
  expect(button, `button ${String(label)} not found`).toBeTruthy();
  await act(async () => {
    (button as HTMLButtonElement).click();
  });
  // Async action handlers (persist → route change) resolve after the click.
  await settle(150);
}

function buttonByLabel(label: string): HTMLButtonElement {
  const button = container.querySelector(`button[aria-label="${label}"]`);
  expect(button, `aria-label ${label} not found`).toBeTruthy();
  return button as HTMLButtonElement;
}

function textOf(scope: Element = container): string {
  return scope.textContent || '';
}

async function settle(ms = 500) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
  window.localStorage.clear();
  window.prompt = (() => null) as typeof window.prompt;
  window.confirm = (() => false) as typeof window.confirm;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('App: project home ⇄ editor flows', () => {
  it('first launch displays the project home with an empty state', async () => {
    await renderApp();
    expect(textOf()).toContain('Likhara Studio');
    expect(textOf()).toContain('New Project');
    expect(textOf()).toContain('Import Project');
    expect(textOf()).toContain('No projects yet');
  }, 15000);

  it('New Project creates a valid persisted project and opens the editor', async () => {
    await renderApp();
    await clickButton('New Project');
    // Editor mounted: starter design tree content is rendered on the canvas.
    expect(textOf()).toContain('Visual React Architecture');

    await settle(); // autosave (250ms debounce) + IDB write
    const projects = await listProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('Untitled Project');
    expect(projects[0].root.children.length).toBeGreaterThan(0);
  }, 15000);

  it('renaming in the editor autosaves; home reflects it; reopening restores', async () => {
    // Seed one project, then open it through the UI.
    const project = createProject('Autosave Target');
    await saveProjectRecord(project);
    await renderApp();
    await clickButton(new RegExp('^Open$'));

    // Edit the project name in the editor header (existing editor behavior).
    const nameInput = container.querySelector(
      'input[aria-label="Project Name"]'
    ) as HTMLInputElement;
    expect(nameInput).toBeTruthy();
    await act(async () => {
      setInputValue(nameInput, 'Renamed Via Editor');
    });
    await settle(); // debounce + save

    const stored = await getProject(project.id);
    expect(stored?.name).toBe('Renamed Via Editor');
    expect(stored?.root.children.length).toBeGreaterThan(0);

    // Back to home → project card shows the new name.
    await clickButton('Back to Project Home');
    expect(textOf()).toContain('Renamed Via Editor');
    expect(textOf()).not.toContain('Visual React Architecture');

    // Reopen → exact design tree restored.
    await clickButton(new RegExp('^Open$'));
    expect(textOf()).toContain('Visual React Architecture');
    const nameAfter = container.querySelector(
      'input[aria-label="Project Name"]'
    ) as HTMLInputElement;
    expect(nameAfter.value).toBe('Renamed Via Editor');
  }, 20000);

  it('two projects remain independent through open/edit cycles', async () => {
    const a = createProject('Alpha');
    await saveProjectRecord(a);
    const b = createProject('Beta');
    await saveProjectRecord(b);

    const openCard = async (name: string) => {
      const card = Array.from(container.querySelectorAll('li')).find((li) =>
        li.textContent?.includes(name)
      );
      expect(card, `project card "${name}" not found`).toBeTruthy();
      await act(async () => {
        (card!.querySelector('button') as HTMLButtonElement).click();
      });
      await settle(150);
    };

    await renderApp();
    // Rename Alpha via editor.
    await openCard('Alpha');
    const nameInput = container.querySelector(
      'input[aria-label="Project Name"]'
    ) as HTMLInputElement;
    expect(nameInput.value).toBe('Alpha');
    await act(async () => {
      setInputValue(nameInput, 'Alpha Edited');
    });
    await settle();
    await clickButton('Back to Project Home');
    await settle(300); // home list reloads asynchronously after remount

    // Open the other project and verify no leakage.
    await openCard('Beta');
    const betaInput = container.querySelector(
      'input[aria-label="Project Name"]'
    ) as HTMLInputElement;
    expect(betaInput.value).toBe('Beta');

    const reloadedA = await getProject(a.id);
    const reloadedB = await getProject(b.id);
    expect(reloadedA?.name).toBe('Alpha Edited');
    expect(reloadedB?.name).toBe('Beta');
    expect(reloadedA?.root).toEqual(reloadedB?.root); // both still hold the starter design
    expect(reloadedA?.id).not.toBe(reloadedB?.id);
  }, 20000);

  it('rename via home preserves id and tree', async () => {
    const project = createProject('Before Rename');
    await saveProjectRecord(project);
    window.prompt = (() => 'After Rename') as typeof window.prompt;

    await renderApp();
    await act(async () => {
      buttonByLabel(`Rename ${project.name}`).click();
    });
    await settle();

    const renamed = await getProject(project.id);
    expect(renamed?.name).toBe('After Rename');
    expect(renamed?.id).toBe(project.id);
    expect(renamed?.root).toEqual(project.root);
  }, 15000);

  it('duplicate creates an independent persisted copy', async () => {
    const project = createProject('Duplicator');
    await saveProjectRecord(project);
    // Distinguish the original tree so independence is observable.
    const original = await getProject(project.id);
    await renderApp();

    await act(async () => {
      buttonByLabel(`Duplicate ${project.name}`).click();
    });
    await settle();

    const all = await listProjects();
    expect(all).toHaveLength(2);
    const copy = all.find((p) => p.id !== project.id)!;
    expect(copy.name).toBe('Duplicator Copy');
    expect(copy.root).toEqual(original?.root);
    expect(copy.createdAt).not.toBe(original?.createdAt);
  }, 15000);

  it('delete requires confirmation and removes only the intended project', async () => {
    const a = createProject('Victim');
    await saveProjectRecord(a);
    const b = createProject('Survivor');
    await saveProjectRecord(b);

    window.confirm = (() => false) as typeof window.confirm;
    await renderApp();
    await act(async () => {
      buttonByLabel(`Delete Victim`).click();
    });
    await settle();
    expect(await listProjects()).toHaveLength(2); // unconfirmed: nothing deleted

    window.confirm = (() => true) as typeof window.confirm;
    await act(async () => {
      buttonByLabel(`Delete Victim`).click();
    });
    await settle();
    const remaining = await listProjects();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('Survivor');
  }, 20000);

  it('invalid project import is rejected and leaves data unchanged', async () => {
    const existing = createProject('Existing');
    await saveProjectRecord(existing);
    await renderApp();

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const bad = new File(['{ this is not json'], 'broken.json', {
      type: 'application/json',
    });
    Object.defineProperty(fileInput, 'files', { value: [bad] });
    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await settle();

    expect(textOf()).toMatch(/Invalid JSON|Import file/);
    const after = await listProjects();
    expect(after).toHaveLength(1);
    expect(after[0].name).toBe('Existing');
  }, 15000);

  it('export → import round-trip preserves the full project document', async () => {
    const project = createProject('Roundtrip');
    project.root.children[0].text = 'Roundtrip Marker';
    await saveProjectRecord(project);

    const stored = (await getProject(project.id))!;
    const exportedJson = JSON.stringify(stored, null, 2); // what the download produces

    const result = parseProjectDocument(exportedJson, [project.id]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.renamedDueToCollision).toBe(true); // never silently overwrites
    await saveProjectRecord(result.project);

    const reimported = (await getProject(result.project.id))!;
    expect(reimported.name).toBe('Roundtrip');
    expect(reimported.viewport).toEqual(stored.viewport);
    // Import normalizes the tree schema (explicit defaults), so compare
    // rendered fidelity instead of byte equality.
    expect(compileToStandaloneHTML(reimported.root)).toBe(
      compileToStandaloneHTML(stored.root)
    );
  }, 15000);

  it('storage failure surfaces a visible error state on home', async () => {
    const realIdb = globalThis.indexedDB;
    // @ts-expect-error intentionally breaking the environment
    globalThis.indexedDB = undefined;
    await renderApp();
    globalThis.indexedDB = realIdb;

    expect(textOf()).toContain('Projects could not be loaded');
    expect(textOf()).toContain('Retry');
  }, 15000);
});
