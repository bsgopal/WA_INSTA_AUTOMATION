const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const backendSrc = path.join(root, 'backend');
const stageDir = path.join(__dirname, 'backend-stage');
const depsHashFile = path.join(stageDir, '.deps-hash');

const EXCLUDED = new Set([
  'node_modules',
  '.git',
  'uploads',
  'test',
  'tests',
  'coverage',
  'venv',
  '.venv',
  '__pycache__',
]);

const EXCLUDED_EXT = new Set(['.log', '.tmp']);
const EXCLUDED_FILES = new Set(['camp_check_tmp.js', 'cleanup_templates.js', 'test_keys2.txt']);

function walk(dir, rel = '') {
  const items = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED.has(entry.name)) continue;
    if (EXCLUDED_FILES.has(entry.name)) continue;
    const src = path.join(dir, entry.name);
    const target = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      items.push(...walk(src, target));
    } else if (!EXCLUDED_EXT.has(path.extname(entry.name))) {
      items.push({ src, target });
    }
  }
  return items;
}

function computeDepsHash() {
  const hash = crypto.createHash('sha256');
  for (const file of ['package.json', 'package-lock.json']) {
    const p = path.join(backendSrc, file);
    if (fs.existsSync(p)) {
      hash.update(fs.readFileSync(p));
    }
    hash.update('\n---\n');
  }
  return hash.digest('hex');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function shouldInstallDeps(prevHash) {
  const nm = path.join(stageDir, 'node_modules');
  if (!fs.existsSync(nm)) return true;
  if (!fs.existsSync(path.join(nm, 'express', 'package.json'))) return true;
  return prevHash !== computeDepsHash();
}

function stage() {
  const clean = process.argv.includes('--clean');
  ensureDir(stageDir);

  const prevHash = fs.existsSync(depsHashFile)
    ? fs.readFileSync(depsHashFile, 'utf8').trim()
    : '';

  const files = walk(backendSrc);

  // 1. Copy or update only changed source files (keeps node_modules intact).
  let copied = 0;
  let skipped = 0;
  for (const { src, target } of files) {
    const dest = path.join(stageDir, target);
    const srcStat = fs.statSync(src);
    let needCopy = true;
    try {
      const dstStat = fs.statSync(dest);
      needCopy = dstStat.size !== srcStat.size || dstStat.mtimeMs < srcStat.mtimeMs;
    } catch (e) {
      needCopy = true;
    }
    if (needCopy) {
      ensureDir(path.dirname(dest));
      fs.copyFileSync(src, dest);
      copied++;
    } else {
      skipped++;
    }
  }

  // 2. Remove stale tracked files (files that existed in a previous stage but
  //    no longer exist in the backend source). Never touch node_modules.
  const wanted = new Set(files.map(f => f.target));
  wanted.add('package.json');
  wanted.add('package-lock.json');
  (function prune(dir, rel = '') {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.deps-hash') continue;
      const target = rel ? path.join(rel, entry.name) : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        prune(full, target);
        try {
          if (fs.readdirSync(full).length === 0) {
            fs.rmdirSync(full);
          }
        } catch (e) { /* keep if non-empty */ }
      } else if (!wanted.has(target)) {
        fs.unlinkSync(full);
      }
    }
  })(stageDir);

  const lock = path.join(backendSrc, 'package-lock.json');
  if (fs.existsSync(lock)) {
    const dest = path.join(stageDir, 'package-lock.json');
    try {
      const dstStat = fs.statSync(dest);
      if (dstStat.size !== fs.statSync(lock).size || dstStat.mtimeMs < fs.statSync(lock).mtimeMs) {
        fs.copyFileSync(lock, dest);
      }
    } catch (e) {
      fs.copyFileSync(lock, dest);
    }
  }

  console.log(`Staged ${files.length} backend files (${copied} copied, ${skipped} unchanged).`);

  // 3. Install production dependencies only when required (package files changed
  //    or node_modules missing). This is what made builds take ~30 min before.
  const needInstall = clean || shouldInstallDeps(prevHash);
  if (needInstall) {
    console.log('Installing production-only backend dependencies...');
    try {
      execSync('npm ci --omit=dev --no-audit --no-fund', {
        cwd: stageDir,
        stdio: 'inherit',
      });
    } catch (err) {
      console.error('npm ci failed:', err.message);
      process.exit(1);
    }
    fs.writeFileSync(depsHashFile, computeDepsHash());
    console.log('Backend staging complete (dependencies installed).');
  } else {
    console.log('Dependencies unchanged - skipped npm ci (use --clean to force reinstall).');
    console.log('Backend staging complete.');
  }
}

stage();