import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { GENERATED_IMAGES } from '../src/data/registry';

interface ManifestChunk {
  file: string;
  imports?: string[];
  dynamicImports?: string[];
  isDynamicEntry?: boolean;
}

const dist = path.resolve('dist');
const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.vite/manifest.json'), 'utf8')) as Record<string, ManifestChunk>;

function staticDependencies(entry: string): Set<string> {
  const visited = new Set<string>();
  function visit(key: string) {
    if (visited.has(key)) return;
    const chunk = manifest[key];
    assert.ok(chunk, `Missing manifest chunk: ${key}`);
    visited.add(key);
    chunk.imports?.forEach(visit);
  }
  visit(entry);
  return visited;
}

describe('public bundle budget', () => {
  it('keeps the editor and optional dialogs out of the initial public route', () => {
    const publicChunks = staticDependencies('src/pages/PuckDocumentPage.tsx');
    const filenames = [...publicChunks].map((key) => manifest[key].file);
    assert.ok(!filenames.some((name) => /EditorPage|AddEntityDrawer|CommandSearchModal/.test(name)));
    assert.equal(manifest['src/pages/EditorPage.tsx']?.isDynamicEntry, true);
    assert.equal(manifest['src/components/AddEntityDrawer.tsx']?.isDynamicEntry, true);
    assert.equal(manifest['src/components/CommandSearchModal.tsx']?.isDynamicEntry, true);
  });

  it('limits initial public JavaScript to 410 kB minified', () => {
    const bytes = [...staticDependencies('src/pages/PuckDocumentPage.tsx')]
      .map((key) => manifest[key].file)
      .filter((file) => file.endsWith('.js'))
      .reduce((total, file) => total + fs.statSync(path.join(dist, file)).size, 0);
    assert.ok(bytes <= 410_000, `Initial public JavaScript is ${bytes} bytes; budget is 410000 bytes`);
  });

  it('ships optimized, resolvable built-in images', () => {
    const sizes = Object.values(GENERATED_IMAGES).map((url) => {
      assert.match(url, /\.webp$/);
      const filename = path.join(dist, url.slice(1));
      assert.ok(fs.existsSync(filename), `Missing image: ${url}`);
      const size = fs.statSync(filename).size;
      assert.ok(size <= 250_000, `${url} exceeds the 250 kB image budget`);
      return size;
    });
    assert.ok(sizes.reduce((sum, size) => sum + size, 0) <= 700_000);
  });
});
