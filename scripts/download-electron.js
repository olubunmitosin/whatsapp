#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

/**
 * Download Electron binary for specific architecture
 * This script helps with Snap builds where network access to GitHub might be limited
 */

function getElectronVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.devDependencies.electron.replace(/[\^~]/, '');
}

function getArchMapping(arch) {
  const mapping = {
    'amd64': 'x64',
    'arm64': 'arm64',
    'armhf': 'armv7l',
    'ppc64el': 'ppc64',
    's390x': 's390x'
  };
  return mapping[arch] || 'x64';
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(dest, () => { }); // Delete the file on error
        reject(err);
      });
    }).on('error', reject);
  });
}

async function downloadElectron(targetArch) {
  const electronVersion = getElectronVersion();
  const electronArch = getArchMapping(targetArch);

  console.log(`📦 Downloading Electron v${electronVersion} for ${electronArch}...`);

  const url = `https://github.com/electron/electron/releases/download/v${electronVersion}/electron-v${electronVersion}-linux-${electronArch}.zip`;
  const electronDir = path.join('node_modules', 'electron', 'dist');
  const zipPath = path.join(electronDir, 'electron.zip');

  // Create directory if it doesn't exist
  fs.mkdirSync(electronDir, { recursive: true });

  try {
    // Download the zip file
    await downloadFile(url, zipPath);
    console.log('✅ Download completed');

    // Extract the zip file
    console.log('📂 Extracting...');
    execSync(`cd "${electronDir}" && unzip -q electron.zip && rm electron.zip`, { stdio: 'inherit' });

    // Make electron executable
    const electronBinary = path.join(electronDir, 'electron');
    if (fs.existsSync(electronBinary)) {
      fs.chmodSync(electronBinary, '755');
      console.log('✅ Electron binary ready');
    }

  } catch (error) {
    console.error('❌ Failed to download Electron:', error.message);
    console.log('💡 You may need to download manually or use a different approach');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const targetArch = args[0] || process.arch;

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Electron Download Script');
    console.log('');
    console.log('Usage: node scripts/download-electron.js [architecture]');
    console.log('');
    console.log('Supported architectures:');
    console.log('  amd64, arm64, armhf, ppc64el, s390x');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/download-electron.js amd64');
    console.log('  node scripts/download-electron.js armhf');
    return;
  }

  downloadElectron(targetArch);
}

if (require.main === module) {
  main();
}

module.exports = { downloadElectron, getElectronVersion, getArchMapping };
