# Snap Build Fixes for kesty-whatsapp

## Problem Analysis

The remote Snap builds were failing with the following error:
```
npm ERR! RequestError: getaddrinfo ENOTFOUND github.com
npm ERR! command sh -c node install.js
```

This occurs because Electron's post-install script tries to download platform-specific binaries from GitHub during `npm install`, but the Snap build environment has restricted network access to GitHub.

## Root Cause

1. **Network Restrictions**: Snap build environments may have limited access to external sites like GitHub
2. **Electron Download Process**: Electron automatically downloads binaries during npm install
3. **Architecture-Specific Binaries**: Each architecture (amd64, arm64, armhf, i386, ppc64el, s390x) requires different Electron binaries

## Solutions Implemented

### 1. **Separated Electron Download** (Primary Fix)

Created a separate `electron` part in snapcraft.yaml that:
- Downloads Electron binaries manually using `wget`
- Handles architecture mapping correctly
- Provides fallback for unsupported architectures
- Runs before the main application build

### 2. **Prevented Automatic Downloads**

Added environment variables and npm configuration:
- `ELECTRON_SKIP_BINARY_DOWNLOAD=1` - Prevents Electron from auto-downloading
- `.npmrc` file with download prevention settings
- `npm ci --ignore-scripts --production` - Skips post-install scripts

### 3. **Architecture Mapping**

Implemented proper architecture mapping:
```bash
amd64 → x64
arm64 → arm64  
armhf → armv7l
i386 → ia32
ppc64el → ppc64
s390x → s390x
```

### 4. **Backup Solutions**

Created alternative approaches:
- `snap/snapcraft-alternative.yaml` - Uses dump plugin approach
- `scripts/download-electron.js` - Manual download script
- Enhanced error handling and fallbacks

## Files Modified

### Core Fixes:
- `snap/snapcraft.yaml` - Main configuration with separated Electron part
- `.npmrc` - NPM configuration to prevent auto-downloads
- `package.json` - Added prepare-snap script

### Alternative Solutions:
- `snap/snapcraft-alternative.yaml` - Alternative configuration
- `scripts/download-electron.js` - Manual Electron download script
- `SNAP_BUILD_FIXES.md` - This documentation

## Testing the Fixes

### Local Testing:
```bash
# Test the download script
node scripts/download-electron.js amd64

# Test npm install without Electron downloads
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci --ignore-scripts
```

### Remote Build Testing:
```bash
# Test with the fixed configuration
npm run build:snap-remote

# Or test specific architecture
snapcraft remote-build --build-for=amd64
```

## Expected Results

With these fixes:
1. ✅ Electron binaries download separately before npm install
2. ✅ No network errors during npm dependency installation  
3. ✅ All architectures (amd64, arm64, armhf, i386, ppc64el, s390x) should build
4. ✅ Proper fallback handling for unsupported architectures
5. ✅ Faster builds due to parallel Electron downloads

## Fallback Strategy

If the primary fix still fails:
1. Use the alternative snapcraft configuration: `cp snap/snapcraft-alternative.yaml snap/snapcraft.yaml`
2. Consider building only for supported architectures initially
3. Use the manual download script for local testing

## Architecture Support Notes

- **Fully Supported**: amd64, arm64, armhf
- **Experimental**: i386, ppc64el, s390x (Electron support may vary)
- **Fallback**: Creates placeholder binary with error message for unsupported architectures

The fixes prioritize stability and provide graceful degradation for architectures where Electron binaries might not be available.
