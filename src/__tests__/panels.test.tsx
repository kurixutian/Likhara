// Phase 2: mobile panel coordination (drawers, toggles, overflow menu).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from '../App';
import { createProject } from '../likhara/projects/projectOps';
import { saveProjectRecord } from '../likhara/projects/storage';

let container: HTMLDivElement;
let root: Root;

async function renderEditor() {
  const project = createProject('Panel Test');
  await saveProjectRecord(project);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<App />);
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 150));
  });
  // Open the project via its card button.
  const card = Array.from(container.querySelectorAll('li')).find((li) =>
    li.textContent?.includes('Panel Test')
  );
  await act(async () => {
    (card!.querySelector('button') as HTMLButtonElement).click();
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 150));
  });
}

function toggle(label: string): HTMLButtonElement {
  const btn = container.querySelector(`button[aria-label="${label}"]`);
  expect(btn, `${label} toggle missing`).toBeTruthy();
  return btn as HTMLButtonElement;
}

async function click(btn: HTMLButtonElement) {
  await act(async () => {
    btn.click();
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
}

function selectedName(): string {
  // The canvas toolbar shows: Selection: <name> (<tag>)
  const chips = Array.from(container.querySelectorAll('span')).filter((s) =>
    s.textContent?.includes('(')
  );
  const toolbarChip = chips.find((s) => s.previousElementSibling?.textContent === 'Selection:');
  return toolbarChip?.textContent || '';
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('mobile panel coordination', () => {
  it('components drawer opens, switches to layers, and dismisses', async () => {
    await renderEditor();
    const components = toggle('Toggle Components panel');

    await click(components);
    expect(components.getAttribute('aria-expanded')).toBe('true');
    // Drawer contains the in-panel Components/Layers switch.
    expect(container.textContent).toContain('Layers (');

    // Switch to Layers inside the drawer.
    const layersTab = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.startsWith('Layers (')
    );
    await click(layersTab as HTMLButtonElement);
    expect(
      Array.from(container.querySelectorAll('span')).some((s) =>
        s.textContent?.includes('Root Workspace')
      )
    ).toBe(true);

    // Dismiss via the drawer's close button.
    await click(toggle('Close panel'));
    expect(components.getAttribute('aria-expanded')).toBe('false');
  }, 20000);

  it('properties opens for the selection and closes without clearing it', async () => {
    await renderEditor();
    const nameBefore = selectedName();
    expect(nameBefore).not.toBe('');

    await click(toggle('Toggle Properties panel'));
    const propsToggle = toggle('Toggle Properties panel');
    expect(propsToggle.getAttribute('aria-expanded')).toBe('true');
    // Inspector shows the selected node.
    expect(container.textContent).toContain(nameBefore);

    await click(toggle('Close panel'));
    expect(propsToggle.getAttribute('aria-expanded')).toBe('false');
    // Selection unchanged after dismissal.
    expect(selectedName()).toBe(nameBefore);
  }, 20000);

  it('opening one drawer closes the other (never both)', async () => {
    await renderEditor();
    await click(toggle('Toggle Components panel'));
    await click(toggle('Toggle Properties panel'));

    expect(toggle('Toggle Components panel').getAttribute('aria-expanded')).toBe('false');
    expect(toggle('Toggle Properties panel').getAttribute('aria-expanded')).toBe('true');
  }, 20000);

  it('overflow menu exposes secondary actions and closes on selection', async () => {
    await renderEditor();
    await click(toggle('More actions'));

    const menu = container.querySelector('[role="menu"]');
    expect(menu).toBeTruthy();
    expect(menu!.textContent).toContain('Workspace Mode');
    expect(menu!.textContent).toContain('Preview Viewport');
    expect(menu!.textContent).toContain('Import JSON');
    expect(menu!.textContent).toContain('Save JSON');
    expect(menu!.textContent).toContain('Reset to Starter');

    // Choosing an item closes the menu.
    const importItem = Array.from(
      container.querySelectorAll('[role="menuitem"]')
    ).find((b) => b.textContent?.includes('Import JSON'));
    await click(importItem as HTMLButtonElement);
    expect(container.querySelector('[role="menu"]')).toBeNull();
  }, 20000);
});
