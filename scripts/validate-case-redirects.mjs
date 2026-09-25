import assert from 'node:assert/strict';
import fs from 'node:fs';

const corpus = JSON.parse(fs.readFileSync(new URL('../data/sanctions.json', import.meta.url), 'utf8'));
const { aliases } = JSON.parse(fs.readFileSync(new URL('../data/case-redirects.json', import.meta.url), 'utf8'));
const current = new Map(corpus.map(row => [row.id, row]));
const sourceCounts = new Map();
for (const row of corpus) sourceCounts.set(row.source_url, (sourceCounts.get(row.source_url) || 0) + 1);
assert.equal(new Set(aliases.map(row => row.from)).size, aliases.length, 'Duplicate redirect source');
for (const alias of aliases) {
  const destination = current.get(alias.to);
  assert.ok(!current.has(alias.from), `Do not shadow a current case: ${alias.from}`);
  assert.ok(destination, `Redirect needs review after corpus refresh: ${alias.from} -> ${alias.to}`);
  assert.equal(destination.source_url, alias.source_url, `Changed document identity: ${alias.from}`);
  assert.equal(sourceCounts.get(alias.source_url), 1, `Ambiguous document identity: ${alias.from}`);
  assert.equal(destination.country, alias.country, `Changed country: ${alias.from}`);
  assert.equal(destination.court, alias.court, `Changed court: ${alias.from}`);
}
console.log(`PASS ${aliases.length} case aliases retain unique source, court and country identity`);
