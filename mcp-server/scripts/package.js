#!/usr/bin/env node
/**
 * Creates release artifacts in <project-root>/releases/:
 *
 *   <name>-v<version>.mcpb       — via `mcpb pack`
 *   validate-companies.zip        — skill zip (SKILL.md at root)
 *   validate-companies-docx.zip   — skill zip (SKILL.md + scripts/ at root)
 *
 * Run via: npm run release  (builds TypeScript first, then calls this script)
 */

'use strict';

const { execSync }  = require('child_process');
const archiver      = require('archiver');
const fs            = require('fs');
const path          = require('path');

const mcpServerDir = path.resolve(__dirname, '..');
const projectRoot  = path.resolve(mcpServerDir, '..');
const releasesDir  = path.join(projectRoot, 'releases');
const skillsDir    = path.join(projectRoot, '.claude', 'skills');

const manifest = JSON.parse(fs.readFileSync(path.join(mcpServerDir, 'manifest.json'), 'utf-8'));
const { version, name } = manifest;

fs.mkdirSync(releasesDir, { recursive: true });

// ── 1. .mcpb via mcpb pack ────────────────────────────────────────────────
// Filename is stable (no version) so the releases/latest/download/ link never changes.
const mcpbName = `${name}.mcpb`;
const mcpbPath = path.join(releasesDir, mcpbName);

console.log(`\nPackaging ${name} v${version}...\n`);
console.log(`  running  mcpb pack`);

execSync(`mcpb pack "${mcpServerDir}" "${mcpbPath}"`, { stdio: 'inherit' });

const mcpbKb = (fs.statSync(mcpbPath).size / 1024).toFixed(1);
console.log(`  created  releases/${mcpbName}  (${mcpbKb} KB)`);

// ── 2. Per-skill zips ─────────────────────────────────────────────────────

/** @param {string} outputPath @param {(a: import('archiver').Archiver) => void} setup */
function createZip(outputPath, setup) {
  return new Promise((resolve, reject) => {
    const out     = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    out.on('close', () => {
      const kb = (archive.pointer() / 1024).toFixed(1);
      console.log(`  created  releases/${path.basename(outputPath)}  (${kb} KB)`);
      resolve();
    });
    archive.on('error', reject);
    archive.pipe(out);
    setup(archive);
    archive.finalize();
  });
}

const skills = fs.readdirSync(skillsDir).filter(
  (entry) => fs.statSync(path.join(skillsDir, entry)).isDirectory()
);

Promise.all(
  skills.map((skill) =>
    createZip(path.join(releasesDir, `${skill}.zip`), (archive) => {
      archive.glob('**/*', {
        cwd: path.join(skillsDir, skill),
        ignore: ['**/__pycache__/**', '**/*.pyc'],
      });
    })
  )
).then(() => {
  console.log('\nDone. Release artifacts are in releases/\n');
}).catch((err) => {
  console.error('\nPackaging failed:', err.message);
  process.exit(1);
});
