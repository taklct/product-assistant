import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const terminologyPath = resolve(__dirname, '..', 'terminology.html');
const html = readFileSync(terminologyPath, 'utf8');

const scriptPattern = /<script>\s*\(function\s*\(\)\s*\{\s*const PAGE_KEY = 'terminology';([\s\S]*?)\}\)\(\);\s*<\/script>/;
const mainScriptMatch = html.match(scriptPattern);
const scriptBody = mainScriptMatch ? mainScriptMatch[1] : '';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getInitialTerms() {
  const match = scriptBody.match(/const initialTermsData = (\[[\s\S]*?\]);/);
  assert.ok(match, 'initialTermsData definition not found');
  const arrayLiteral = match[1];
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${arrayLiteral});`)();
}

test('bootstrap dataset defines ten terms with required fields', () => {
  const terms = getInitialTerms();
  assert.strictEqual(terms.length, 10, `Expected 10 initial terms but found ${terms.length}`);

  terms.forEach((term, index) => {
    assert.ok(term.term && typeof term.term === 'string', `Term name missing for entry ${index + 1}`);
    assert.ok(Object.prototype.hasOwnProperty.call(term, 'definition'), `Definition missing for entry ${term.term}`);
    assert.ok(Array.isArray(term.synonyms), `Synonyms must be an array for ${term.term}`);
    assert.ok(term.lastChange && typeof term.lastChange === 'string', `Last change missing for ${term.term}`);
  });
});

test('renders headers for key columns', () => {
  const headerStart = html.indexOf('<!-- Terms Table -->');
  const bodyStart = html.indexOf('<!-- Table Body -->');
  assert.ok(headerStart !== -1 && bodyStart !== -1, 'Could not locate table header section');
  const headerSection = html.slice(headerStart, bodyStart);

  const requiredHeaders = ['Term (Canonical)', 'Definition', 'Synonyms', 'Last Change'];
  for (const header of requiredHeaders) {
    const pattern = new RegExp(`>\\s*${escapeRegExp(header)}\\s*<`, 'i');
    assert.ok(pattern.test(headerSection), `Missing table header for ${header}`);
  }
});

test('render display row template uses expected column classes', () => {
  const requiredSnippets = [
    "termColumn.className = 'col-span-3';",
    "definitionColumn.className = 'col-span-4 text-sm text-gray-600';",
    "synonymsColumn.className = 'col-span-2 flex flex-wrap gap-1';",
    "lastChangeColumn.className = 'col-span-2 text-sm text-gray-600';",
    "actionsColumn.className = 'actions col-span-1 flex justify-end space-x-3 opacity-0 transition-opacity';"
  ];

  requiredSnippets.forEach((snippet) => {
    assert.ok(scriptBody.includes(snippet), `Missing expected class assignment: ${snippet}`);
  });
});
