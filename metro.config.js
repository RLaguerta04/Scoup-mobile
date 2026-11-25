// ─── Windows EMFILE mitigation (this machine has no Watchman) ────────────────
// A cold Metro bundle opens far more file handles than the process allows and
// dies with `EMFILE: too many open files`. Three guards, all no-ops on machines
// that never hit the limit (CI, macOS):
//   1. graceful-fs — queue + retry for the callback fs API.
//   2. fs.promises semaphore — the crash is in node:internal/fs/promises, which
//      graceful-fs can't patch; cap concurrent promise-based file ops so open
//      handles stay bounded during the dependency-graph traversal.
//   3. maxWorkers = 1 + no persistent cache — minimise simultaneous opens.
const fs = require('fs');
require('graceful-fs').gracefulify(fs);

// Bound concurrent fs.promises operations. 40 is well under the handle ceiling
// yet high enough to keep the build moving.
const MAX_CONCURRENT_FS = 40;
let activeFs = 0;
const fsQueue = [];
const pump = () => {
  while (activeFs < MAX_CONCURRENT_FS && fsQueue.length) fsQueue.shift()();
};
const limit = (fn) =>
  new Promise((resolve, reject) => {
    fsQueue.push(() => {
      activeFs++;
      fn().then(
        (v) => { activeFs--; pump(); resolve(v); },
        (e) => { activeFs--; pump(); reject(e); },
      );
    });
    pump();
  });

// Cover reads AND writes — the transform cache writes *.mp files via
// fs.promises too, so throttling writes keeps the on-disk cache from EMFILE-ing.
const FS_METHODS = [
  'open', 'readFile', 'stat', 'lstat', 'readdir', 'realpath', 'access',
  'writeFile', 'appendFile', 'mkdir', 'unlink', 'rm', 'rmdir', 'rename', 'copyFile', 'truncate',
];
const patched = new Set();
for (const mod of [fs.promises, require('fs/promises')]) {
  if (patched.has(mod)) continue;
  patched.add(mod);
  for (const name of FS_METHODS) {
    const orig = mod[name];
    if (typeof orig === 'function') {
      const bound = orig.bind(mod);
      mod[name] = (...args) => limit(() => bound(...args));
    }
  }
}

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
config.maxWorkers = 1;

// maplibre-gl (web map, loaded only in *.web.tsx) ships pure ESM with no `main`
// field — its entry lives behind the package `exports` map (`dist/maplibre-gl.mjs`).
// Metro's dev resolver only reads that map when package exports are enabled, so
// without this the web bundle 500s on `Cannot resolve maplibre-gl`. `.mjs`/`.cjs`
// cover its sibling chunks (shared/worker).
config.resolver.unstable_enablePackageExports = true;
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];
// Keep the default on-disk transform cache: with the semaphore guarding its
// fs.promises writes it no longer EMFILEs, and spilling modules to disk keeps
// memory low so web + iOS + Android bundles can coexist without an OOM.

module.exports = withNativeWind(config, { input: './src/global.css' });
