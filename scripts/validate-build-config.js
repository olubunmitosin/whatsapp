#!/usr/bin/env node

// Validates that the release-critical configuration is consistent before a
// Snapcraft dashboard build: required files present, versions in sync between
// package.json and snapcraft.yaml, and the Electron binary pinned in sync.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function checkFile(relativePath, description) {
  const full = path.join(root, relativePath);
  if (fs.existsSync(full)) {
    console.log(`✅ ${description}: ${relativePath}`);
    return true;
  }
  console.log(`❌ ${description}: ${relativePath} (missing)`);
  return false;
}

function checkVersionSync() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const snapcraftYaml = fs.readFileSync(path.join(root, 'snap', 'snapcraft.yaml'), 'utf8');

    const packageVersion = packageJson.version;
    const match = snapcraftYaml.match(/^version:\s*['"]?([^'"]+)['"]?$/m);
    const snapVersion = match ? match[1] : null;

    if (packageVersion === snapVersion) {
      console.log(`✅ Version sync: ${packageVersion} (package.json ↔ snapcraft.yaml)`);
      return true;
    }
    console.log(`❌ Version mismatch: package.json(${packageVersion}) ≠ snapcraft.yaml(${snapVersion})`);
    return false;
  } catch (error) {
    console.log(`❌ Version check failed: ${error.message}`);
    return false;
  }
}

function checkElectronVersionSync() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const snapcraftYaml = fs.readFileSync(path.join(root, 'snap', 'snapcraft.yaml'), 'utf8');

    const electronVersion = (packageJson.devDependencies.electron || '').replace(/[\^~]/, '');
    const match = snapcraftYaml.match(/ELECTRON_VERSION="([^"]+)"/);
    const snapElectronVersion = match ? match[1] : null;

    if (electronVersion && electronVersion === snapElectronVersion) {
      console.log(`✅ Electron version sync: ${electronVersion} (package.json ↔ snapcraft.yaml)`);
      return true;
    }
    console.log(`❌ Electron version mismatch: package.json(${electronVersion}) ≠ snapcraft.yaml(${snapElectronVersion})`);
    return false;
  } catch (error) {
    console.log(`❌ Electron version check failed: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔍 Validating kesty-whatsapp build configuration...\n');

  const required = [
    ['package.json', 'Package configuration'],
    ['snap/snapcraft.yaml', 'Snap configuration'],
    ['snap/gui/kesty-whatsapp.desktop', 'Desktop file'],
    ['.npmrc', 'NPM configuration'],
    ['main.js', 'Main application file'],
    ['app/preload.js', 'Preload script']
  ];

  let allValid = true;
  for (const [file, description] of required) {
    allValid = checkFile(file, description) && allValid;
  }

  console.log('\n🔄 Version synchronization:');
  allValid = checkVersionSync() && allValid;
  allValid = checkElectronVersionSync() && allValid;

  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('🎉 All validations passed! Ready for Snapcraft dashboard build.');
  } else {
    console.log('⚠️ Some validations failed. Please fix the issues above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}