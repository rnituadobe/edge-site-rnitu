/* eslint-env node, es2020 */
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import decorate from './content-fragment-block.js';

const AUTHOR = 'https://author-p167205-e1910614.adobeaemcloud.com';

function element() {
  return {
    dataset: {},
    attributes: {},
    children: [],
    textContent: '',
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    setAttribute(name, value) { this.attributes[name] = value; },
  };
}

function fixture(reference, { authoring = true, link = false, connection = `aem:${AUTHOR}` } = {}) {
  globalThis.document = {
    createElement: element,
    querySelector: () => (connection === null ? null : { content: connection }),
  };
  return Object.assign(element(), {
    textContent: reference,
    hasAttribute: (name) => authoring && name === 'data-aue-resource',
    querySelector: () => (link ? { getAttribute: () => reference } : null),
  });
}

afterEach(() => {
  delete globalThis.document;
});

test('exposes the native fragment model without replacing it with the block picker model', () => {
  const block = fixture('/content/dam/test/checkboxes');
  decorate(block);
  const [card] = block.children;
  assert.equal(card.dataset.aueResource, 'urn:aem-fragments:/content/dam/test/checkboxes/jcr:content/data/master');
  assert.equal(card.dataset.aueType, 'component');
  assert.equal(card.dataset.aueModel, undefined);
  assert.equal(card.children[2].textContent, '/content/dam/test/checkboxes');
});

test('accepts a picker link on the configured Author and decodes its path', () => {
  const block = fixture(`${AUTHOR}/content/dam/test/my%20fragment`, { link: true });
  decorate(block);
  assert.equal(block.children[0].dataset.aueResource, 'urn:aem-fragments:/content/dam/test/my fragment/jcr:content/data/master');
});

test('keeps an empty block selectable for choosing a fragment', () => {
  const block = fixture('');
  decorate(block);
  assert.match(block.children[0].textContent, /choose a Content Fragment/);
  assert.equal(block.children[0].dataset.aueResource, undefined);
});

test('hides the authoring-only card on published pages', () => {
  const block = fixture('/content/dam/test/checkboxes', { authoring: false });
  delete globalThis.document;
  decorate(block);
  assert.equal(block.hidden, true);
  assert.deepEqual(block.children, []);
});

test('reports invalid references and missing connections instead of exposing a write target', (context) => {
  const errors = context.mock.method(console, 'error', () => {});
  const cases = [
    { reference: 'https://other.example/content/dam/test/checkboxes' },
    { reference: '/content/test/page' },
    { reference: '/content/dam/test/' },
    { reference: '/content/dam/test/checkboxes?variation=test' },
    { reference: '/content/dam/test/checkboxes', connection: null },
    { reference: '/content/dam/test/checkboxes', connection: 'xwalk:https://author.example' },
  ];
  cases.forEach(({ reference, ...options }) => {
    const block = fixture(reference, options);
    decorate(block);
    const [card] = block.children;
    assert.equal(card.attributes.role, 'alert');
    assert.equal(card.dataset.aueResource, undefined);
    assert.match(card.textContent, /^Unable to edit Content Fragment:/);
  });
  assert.equal(errors.mock.callCount(), cases.length);
});
