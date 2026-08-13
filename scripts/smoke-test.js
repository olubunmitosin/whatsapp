#!/usr/bin/env node

// Smoke test: boots the app with the real Electron binary and verifies it
// starts without crashing. The window stays open by design (closing hides it),
// so a clean "still running" state after the grace period is a pass.

const { spawn } = require('child_process');
const path = require('path');

const electronBinary = require('electron');
const appRoot = path.join(__dirname, '..');

const TIMEOUT_MS = 20000;
const child = spawn(electronBinary, [appRoot], {
  env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
child.stdout.on('data', (chunk) => { output += chunk; });
child.stderr.on('data', (chunk) => { output += chunk; });

let finished = false;

function fail(message) {
  if (finished) return;
  finished = true;
  console.error(`FAIL: ${message}`);
  console.error(output);
  child.kill('SIGKILL');
  process.exit(1);
}

function pass() {
  if (finished) return;
  finished = true;
  child.kill('SIGTERM');
  console.log('PASS: app started and stayed running without crashing');
  process.exit(0);
}

child.on('error', (error) => fail(`could not launch electron: ${error.message}`));
child.on('exit', (code, signal) => {
  if (!finished) {
    fail(`app exited unexpectedly (code=${code}, signal=${signal})`);
  }
});

const timer = setTimeout(pass, TIMEOUT_MS);
timer.unref();