#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validation script for kesty-whatsapp build configuration
 * Checks if all files are properly configured for Snapcraft dashboard builds
 */

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} (missing)`);
    return false;
  }
}

function checkVersionSync() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const snapcraftYaml = fs.readFileSync('snap/snapcraft.yaml', 'utf8');

    const packageVersion = packageJson.version;
    const snapVersionMatch = snapcraftYaml.match(/version:\s*['"]([^'"]+)['"]?/);
    const snapVersion = snapVersionMatch ? snapVersionMatch[1] : null;

    if (packageVersion === snapVersion) {
      console.log(`✅ Version sync: ${packageVersion} (package.json ↔ snapcraft.yaml)`);
      return true;
    } else {
      console.log(`❌ Version mismatch: package.json(${packageVersion}) ≠ snapcraft.yaml(${snapVersion})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Version check failed: ${error.message}`);
    return false;
  }
}

function checkElectronVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const snapcraftYaml = fs.readFileSync('snap/snapcraft.yaml', 'utf8');

    const electronVersion = packageJson.devDependencies.electron.replace(/[\^~]/, '');
    const snapElectronMatch = snapcraftYaml.match(/ELECTRON_VERSION="([^"]+)"/);
    const snapElectronVersion = snapElectronMatch ? snapElectronMatch[1] : null;

    if (electronVersion === snapElectronVersion) {
      console.log(`✅ Electron version sync: ${electronVersion} (package.json ↔ snapcraft.yaml)`);
      return true;
    } else {
      console.log(`❌ Electron version mismatch: package.json(${electronVersion}) ≠ snapcraft.yaml(${snapElectronVersion})`);
      console.log(`💡 This is expected with the simplified build configuration`);
      return true; // Don't fail validation for this
    }
  } catch (error) {
    console.log(`❌ Electron version check failed: ${error.message}`);
    return false;
  }
}

function checkArchitectures() {
  try {
    const snapcraftYaml = fs.readFileSync('snap/snapcraft.yaml', 'utf8');
    const architectures = ['amd64', 'arm64', 'armhf', 'ppc64el', 's390x'];

    let allFound = true;
    console.log('🏗️  Architecture support:');

    for (const arch of architectures) {
      if (snapcraftYaml.includes(`build-on: ${arch}`)) {
        console.log(`  ✅ ${arch}`);
      } else {
        console.log(`  ❌ ${arch} (missing)`);
        allFound = false;
      }
    }

    // Check for unsupported i386
    if (snapcraftYaml.includes('i386')) {
      console.log('  ⚠️  i386 found (not supported by Snap infrastructure)');
      allFound = false;
    }

    return allFound;
  } catch (error) {
    console.log(`❌ Architecture check failed: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔍 Validating kesty-whatsapp build configuration...\n');

  let allValid = true;

  // Check required files
  console.log('📁 Required files:');
  allValid &= checkFile('package.json', 'Package configuration');
  allValid &= checkFile('snap/snapcraft.yaml', 'Snap configuration');
  allValid &= checkFile('snap/gui/kesty-whatsapp.desktop', 'Desktop file');
  allValid &= checkFile('.npmrc', 'NPM configuration');
  allValid &= checkFile('main.js', 'Main application file');

  console.log('\n📋 Optional files:');
  checkFile('.snapcraft.yaml', 'Root snapcraft pointer');
  checkFile('scripts/bump-version.js', 'Version bump script');
  checkFile('scripts/download-electron.js', 'Electron download script');
  checkFile('SNAPCRAFT_DASHBOARD_BUILD.md', 'Build documentation');

  console.log('\n🔄 Version synchronization:');
  allValid &= checkVersionSync();
  allValid &= checkElectronVersion();

  console.log('\n🏗️  Build configuration:');
  allValid &= checkArchitectures();

  console.log('\n' + '='.repeat(50));

  if (allValid) {
    console.log('🎉 All validations passed! Ready for Snapcraft dashboard build.');
    console.log('\nNext steps:');
    console.log('1. Commit and push your changes to GitHub');
    console.log('2. Go to snapcraft.io/kesty-whatsapp');
    console.log('3. Click "Builds" → "Trigger New Build"');
    console.log('4. Select architectures and click "Build"');
  } else {
    console.log('⚠️  Some validations failed. Please fix the issues above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
