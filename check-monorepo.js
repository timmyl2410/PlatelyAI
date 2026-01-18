#!/usr/bin/env node

/**
 * Monorepo Health Check
 * Validates the monorepo setup and checks for common issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const checks = [];
let allPassed = true;

function check(name, fn) {
  checks.push({ name, fn });
}

function runChecks() {
  console.log('🔍 PlatelyAI Monorepo Health Check\n');

  for (const { name, fn } of checks) {
    try {
      const result = fn();
      if (result === true) {
        console.log(`✅ ${name}`);
      } else {
        console.log(`⚠️  ${name}: ${result}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      allPassed = false;
    }
  }

  console.log('');
  if (allPassed) {
    console.log('🎉 All checks passed! Your monorepo is ready to use.');
    console.log('\nNext steps:');
    console.log('  1. Run: pnpm install');
    console.log('  2. Run: pnpm dev (test web app)');
    console.log('  3. Run: pnpm dev:backend (test backend)');
    console.log('  4. Build shared: cd packages/shared && pnpm build');
  } else {
    console.log('⚠️  Some checks failed. Review the issues above.');
    process.exit(1);
  }
}

// Check: pnpm-workspace.yaml exists
check('pnpm-workspace.yaml exists', () => {
  return fs.existsSync('pnpm-workspace.yaml');
});

// Check: packages/shared exists
check('packages/shared exists', () => {
  return fs.existsSync('packages/shared/package.json');
});

// Check: Shared package has correct name
check('Shared package name is @plately/shared', () => {
  const pkg = JSON.parse(fs.readFileSync('packages/shared/package.json', 'utf8'));
  return pkg.name === '@plately/shared' || `Found: ${pkg.name}`;
});

// Check: Shared package has src/index.ts
check('Shared package has src/index.ts', () => {
  return fs.existsSync('packages/shared/src/index.ts');
});

// Check: Firestore paths exist
check('Firestore paths file exists', () => {
  return fs.existsSync('packages/shared/src/firestore/paths.ts');
});

// Check: Models exist
check('Inventory model exists', () => {
  return fs.existsSync('packages/shared/src/models/inventory.ts');
});

check('Scans model exists', () => {
  return fs.existsSync('packages/shared/src/models/scans.ts');
});

check('Meals model exists', () => {
  return fs.existsSync('packages/shared/src/models/meals.ts');
});

check('User model exists', () => {
  return fs.existsSync('packages/shared/src/models/user.ts');
});

// Check: apps/mobile exists
check('apps/mobile placeholder exists', () => {
  return fs.existsSync('apps/mobile/PlatelyAIMobile/package.json') || fs.existsSync('apps/mobile/README.md');
});

// Check: Root package.json has workspace scripts
check('Root package.json has workspace scripts', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = pkg.scripts || {};
  if (!scripts['dev:web']) return 'Missing dev:web script';
  if (!scripts['dev:backend']) return 'Missing dev:backend script';
  if (!scripts['dev:mobile']) return 'Missing dev:mobile script';
  return true;
});

// Check: Root package.json name changed
check('Root package.json renamed to @plately/web', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return pkg.name === '@plately/web' || `Found: ${pkg.name} (this is OK, just FYI)`;
});

// Check: Original web app files untouched
check('Web app src/ folder intact', () => {
  return fs.existsSync('src/main.tsx') && fs.existsSync('src/app/App.tsx');
});

check('Backend folder intact', () => {
  return fs.existsSync('backend/server.js');
});

check('Netlify config intact', () => {
  return fs.existsSync('netlify.toml');
});

check('Vite config intact', () => {
  return fs.existsSync('vite.config.ts');
});

// Check: Documentation exists
check('MONOREPO_SETUP.md exists', () => {
  return fs.existsSync('MONOREPO_SETUP.md');
});

check('QUICKSTART.md exists', () => {
  return fs.existsSync('QUICKSTART.md');
});

check('SUMMARY.md exists', () => {
  return fs.existsSync('SUMMARY.md');
});

// Run all checks
runChecks();
