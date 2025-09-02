#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Version bump script for kesty-whatsapp
 * Increments version in both package.json and snapcraft.yaml
 * Usage: node scripts/bump-version.js [major|minor|patch] [--auto]
 * Default: patch
 * --auto: Automatically commit, tag, and push changes
 */

function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);

  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }

  return parts.join('.');
}

function updatePackageJson(newVersion) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  const oldVersion = packageJson.version;
  packageJson.version = newVersion;

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`📦 Updated package.json: ${oldVersion} → ${newVersion}`);

  return oldVersion;
}

function updateSnapcraftYaml(newVersion) {
  const snapcraftPath = path.join(__dirname, '..', 'snap', 'snapcraft.yaml');
  let snapcraftContent = fs.readFileSync(snapcraftPath, 'utf8');

  // Extract current version
  const versionMatch = snapcraftContent.match(/^version:\s*['"]?([^'"]+)['"]?$/m);
  const oldVersion = versionMatch ? versionMatch[1] : 'unknown';

  // Replace version
  snapcraftContent = snapcraftContent.replace(
    /^version:\s*['"]?[^'"]+['"]?$/m,
    `version: '${newVersion}'`
  );

  fs.writeFileSync(snapcraftPath, snapcraftContent);
  console.log(`📋 Updated snapcraft.yaml: ${oldVersion} → ${newVersion}`);

  return oldVersion;
}

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to ${description.toLowerCase()}: ${error.message}`);
    return false;
  }
}

function performGitOperations(newVersion, autoMode = false) {
  if (!autoMode) {
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review the changes');
    console.log(`  2. Commit: git add . && git commit -m "Bump version to ${newVersion}"`);
    console.log(`  3. Tag: git tag v${newVersion}`);
    console.log('  4. Push: git push && git push --tags');
    console.log('  5. Build: npm run build:snap-remote');
    return;
  }

  console.log('');
  console.log('🚀 Performing automated git operations...');
  console.log('');

  // Step 2: Commit changes
  if (!runCommand('git add .', 'Adding changes to git')) return false;
  if (!runCommand(`git commit -m "Bump version to ${newVersion}"`, 'Committing changes')) return false;

  // Step 3: Create tag
  if (!runCommand(`git tag v${newVersion}`, `Creating tag v${newVersion}`)) return false;

  // Step 4: Push changes and tags
  if (!runCommand('git push', 'Pushing changes to remote')) return false;
  if (!runCommand('git push --tags', 'Pushing tags to remote')) return false;

  // Step 5: Build snap package
  console.log('');
  console.log('🏗️  Starting remote snap build...');
  if (!runCommand('npm run build:snap-remote', 'Building snap package remotely')) return false;

  console.log('');
  console.log('🎉 All operations completed successfully!');
  console.log(`📦 Version ${newVersion} has been released and is building.`);

  return true;
}

function main() {
  const args = process.argv.slice(2);
  let bumpType = 'patch';
  let autoMode = false;

  // Parse arguments
  for (const arg of args) {
    if (arg === '--auto' || arg === '-a') {
      autoMode = true;
    } else if (['major', 'minor', 'patch'].includes(arg)) {
      bumpType = arg;
    } else if (arg !== '--help' && arg !== '-h') {
      console.error(`❌ Invalid argument: ${arg}`);
      console.log('Usage: node scripts/bump-version.js [major|minor|patch] [--auto]');
      console.log('  --auto: Automatically commit, tag, push, and build');
      process.exit(1);
    }
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Version Bump Script for kesty-whatsapp');
    console.log('');
    console.log('Usage: node scripts/bump-version.js [major|minor|patch] [--auto]');
    console.log('');
    console.log('Arguments:');
    console.log('  major    Bump major version (1.2.3 → 2.0.0)');
    console.log('  minor    Bump minor version (1.2.3 → 1.3.0)');
    console.log('  patch    Bump patch version (1.2.3 → 1.2.4) [default]');
    console.log('  --auto   Automatically commit, tag, push, and build');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/bump-version.js patch');
    console.log('  node scripts/bump-version.js minor --auto');
    console.log('  npm run version:patch');
    console.log('  npm run version:minor');
    return;
  }

  try {
    // Read current version from package.json
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const currentVersion = packageJson.version;

    // Calculate new version
    const newVersion = incrementVersion(currentVersion, bumpType);

    console.log(`🚀 Bumping version (${bumpType}): ${currentVersion} → ${newVersion}`);
    if (autoMode) {
      console.log('🤖 Auto mode enabled - will commit, tag, push, and build automatically');
    }
    console.log('');

    // Update both files
    updatePackageJson(newVersion);
    updateSnapcraftYaml(newVersion);

    console.log('');
    console.log('✅ Version bump completed successfully!');

    // Perform git operations
    performGitOperations(newVersion, autoMode);

  } catch (error) {
    console.error('❌ Error bumping version:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { incrementVersion, updatePackageJson, updateSnapcraftYaml };
