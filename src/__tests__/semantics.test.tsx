import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import LikharaEditor from '../likhara/LikharaEditor';
import {
  LikharaProject,
  UINode,
  createDefaultStyle,
  parseAndValidateImport,
  validateExportedCode,
  compileToReactTailwind,
  compileToReactInlineStyle,
  compileToStandaloneHTML,
  isSafeUrl,
} from '../likhara/core';

function makeProject(): LikharaProject {
  return {
    schemaVersion: 1,
    id: 'proj-semantic',
    name: 'Semantic Test',
    createdAt: '2026-11-18T00:00:00.000Z',
    updatedAt: '2026-11-18T00:00:00.000Z',
    viewport: { mode: 'desktop', zoom: 100, background: '#09090b' },
    root: makeSemanticTree(),
  };
}

function makeSemanticTree(): UINode {
  return {
    id: 'root',
    tag: 'div',
    name: 'Root',
    isContainer: true,
    style: createDefaultStyle(),
    children: [
      {
        id: 'link-1',
        tag: 'a',
        name: 'Docs Link',
        isContainer: false,
        text: 'Read Docs',
        href: 'https://example.com/docs',
        targetBlank: true,
        ariaLabel: 'Documentation',
        style: createDefaultStyle(),
        children: [],
      },
      {
        id: 'form-1',
        tag: 'form',
        name: 'Signup Form',
        isContainer: true,
        style: createDefaultStyle(),
        children: [
          {
            id: 'email-1',
            tag: 'input',
            name: 'Email Input',
            isContainer: false,
            inputType: 'email',
            nameAttr: 'email',
            placeholder: 'you@example.com',
            required: true,
            ariaLabel: 'Email Address',
            style: createDefaultStyle(),
            children: [],
          },
          {
            id: 'bio-1',
            tag: 'textarea',
            name: 'Bio',
            isContainer: false,
            placeholder: 'Tell us about yourself',
            style: createDefaultStyle(),
            children: [],
          },
          {
            id: 'submit-1',
            tag: 'button',
            name: 'Submit Button',
            isContainer: false,
            text: 'Sign Up',
            actionType: 'submit',
            style: createDefaultStyle(),
            children: [],
          },
        ],
      },
      {
        id: 'btn-event',
        tag: 'button',
        name: 'Event Button',
        isContainer: false,
        text: 'Trigger Event',
        actionType: 'custom-event',
        actionTarget: 'open-modal',
        style: createDefaultStyle(),
        children: [],
      },
      {
        id: 'img-1',
        tag: 'img',
        name: 'Hero Image',
        isContainer: false,
        src: 'https://example.com/hero.png',
        alt: 'Product hero preview',
        style: createDefaultStyle(),
        children: [],
      },
    ],
  };
}

describe('Phase 4: component semantics & preview behavior', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  function switchToPreview() {
    const previewBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => /preview/i.test(b.textContent || '')
    );
    expect(previewBtn).toBeTruthy();
    previewBtn!.click();
  }

  it('renders link href, targetBlank, and image src/alt in preview', async () => {
    await act(async () => {
      root.render(
        <LikharaEditor
          project={makeProject()}
          onExit={() => {}}
        />
      );
    });

    await act(async () => {
      switchToPreview();
    });

    const link = container.querySelector(
      'a[aria-label="Documentation"]'
    ) as HTMLAnchorElement | null;
    expect(link).not.toBeNull();
    expect(link!.textContent).toBe('Read Docs');
    expect(link!.getAttribute('href')).toBe('https://example.com/docs');
    expect(link!.getAttribute('target')).toBe('_blank');
    expect(link!.getAttribute('rel')).toBe('noopener noreferrer');

    const img = container.querySelector(
      'img[alt="Product hero preview"]'
    ) as HTMLImageElement | null;
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('https://example.com/hero.png');
  });

  it('inputs accept values in preview and form submits with feedback', async () => {
    await act(async () => {
      root.render(
        <LikharaEditor
          project={makeProject()}
          onExit={() => {}}
        />
      );
    });

    await act(async () => {
      switchToPreview();
    });

    const emailInput = container.querySelector(
      'input[placeholder="you@example.com"]'
    ) as HTMLInputElement | null;
    expect(emailInput).not.toBeNull();
    expect(emailInput!.getAttribute('type')).toBe('email');
    expect(emailInput!.required).toBe(true);
    expect(emailInput!.readOnly).toBe(false);

    const form = emailInput!.closest('form')!;
    // Empty required field triggers validation error
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(container.textContent).toMatch(/Validation error:/i);

    // Fill input and submit form cleanly
    emailInput!.value = 'ada@example.com';
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(container.textContent).toMatch(/validated and submitted/i);
  });

  it('button custom-event action triggers preview feedback', async () => {
    await act(async () => {
      root.render(
        <LikharaEditor
          project={makeProject()}
          onExit={() => {}}
        />
      );
    });

    await act(async () => {
      switchToPreview();
    });

    const eventBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Trigger Event'
    );
    expect(eventBtn).toBeTruthy();
    await act(async () => {
      eventBtn!.click();
    });
    expect(container.textContent).toMatch(/open-modal/i);
  });

  it('preserves all semantic properties across JSON export/import validation', () => {
    const tree = makeSemanticTree();
    const raw = JSON.stringify({ projectName: 'Semantic Test', root: tree });
    const result = parseAndValidateImport(raw);
    expect(result.valid).toBe(true);
    expect(result.root).toBeDefined();

    const importedLink = result.root!.children[0];
    expect(importedLink.href).toBe('https://example.com/docs');
    expect(importedLink.targetBlank).toBe(true);
    expect(importedLink.ariaLabel).toBe('Documentation');

    const importedEmail = result.root!.children[1].children[0];
    expect(importedEmail.inputType).toBe('email');
    expect(importedEmail.required).toBe(true);
    expect(importedEmail.nameAttr).toBe('email');

    const importedImg = result.root!.children[3];
    expect(importedImg.src).toBe('https://example.com/hero.png');
    expect(importedImg.alt).toBe('Product hero preview');
  });

  it('validates exported code across all 3 formats and rejects unsafe javascript: URLs', () => {
    const tree = makeSemanticTree();
    const tw = compileToReactTailwind(tree);
    const inline = compileToReactInlineStyle(tree);
    const html = compileToStandaloneHTML(tree, 'Semantic Test');

    expect(validateExportedCode(tree, 'react-tw', tw).valid).toBe(true);
    expect(validateExportedCode(tree, 'react-inline', inline).valid).toBe(true);
    expect(validateExportedCode(tree, 'html', html).valid).toBe(true);
    expect(html).toContain('data-action="custom-event"');

    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);

    const badImport = parseAndValidateImport(
      JSON.stringify({
        schemaVersion: 1,
        root: {
          ...tree,
          children: [
            {
              id: 'bad-link',
              name: 'Bad Link',
              tag: 'a',
              isContainer: false,
              href: 'javascript:alert(1)',
              style: createDefaultStyle(),
              children: [],
            },
          ],
        },
      })
    );
    expect(badImport.valid).toBe(false);
  });
});
