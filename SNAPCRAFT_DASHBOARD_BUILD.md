# Building kesty-whatsapp via Snapcraft Dashboard

## Overview

This guide covers building the kesty-whatsapp Snap package using the Snapcraft dashboard's "Trigger New Build" feature, which builds directly from your GitHub repository.

## Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Snapcraft Account**: Linked to your GitHub account
3. **Snap Store Registration**: The snap name `kesty-whatsapp` should be registered

## Build Configuration Summary

### Supported Architectures
- **amd64** - 64-bit Intel/AMD processors
- **arm64** - 64-bit ARM processors (Apple Silicon, Raspberry Pi 4+)
- **armhf** - 32-bit ARM processors (Raspberry Pi 2/3)
- **ppc64el** - 64-bit PowerPC processors
- **s390x** - IBM System z processors

### Key Features
- **Electron 37.1.0** - Latest stable version
- **Separated Electron Download** - Prevents network issues during build
- **Multi-download Methods** - Uses both wget and curl for reliability
- **Comprehensive Dependencies** - All required runtime libraries included
- **Optimized NPM Configuration** - Prevents unnecessary downloads and timeouts

## Build Process

### 1. Trigger Build from Dashboard

1. Go to [snapcraft.io](https://snapcraft.io)
2. Navigate to your snap page: `https://snapcraft.io/kesty-whatsapp`
3. Click on "Builds" tab
4. Click "Trigger New Build"
5. Select the architectures you want to build
6. Click "Build"

### 2. Build Steps (Automated)

The build process will:

1. **Clone Repository** - Snapcraft clones your GitHub repo
2. **Download Electron** - Separate part downloads Electron binaries for each architecture
3. **Install Dependencies** - NPM installs app dependencies without Electron
4. **Package Application** - Combines Electron + app into Snap package
5. **Test & Validate** - Runs basic validation tests

### 3. Expected Build Time

- **amd64**: ~10-15 minutes
- **arm64**: ~15-20 minutes  
- **armhf**: ~20-25 minutes
- **ppc64el**: ~20-30 minutes
- **s390x**: ~20-30 minutes

## Configuration Files

### Core Configuration
- `snap/snapcraft.yaml` - Main Snap configuration
- `.npmrc` - NPM build optimization
- `package.json` - Application dependencies and metadata

### Build Optimization
- **Electron Download**: Separate part prevents npm install issues
- **Dependency Caching**: Optimized npm configuration
- **Multi-method Downloads**: wget + curl fallback for reliability
- **Comprehensive Logging**: Detailed build output for debugging

## Troubleshooting

### Common Issues

1. **Electron Download Fails**
   - Build includes fallback mechanisms
   - Creates placeholder with error message if download fails
   - Check GitHub releases for architecture availability

2. **NPM Install Timeouts**
   - Increased timeout to 300 seconds
   - Disabled optional dependencies
   - Uses production-only installs

3. **Missing Dependencies**
   - Comprehensive stage-packages list included
   - All Electron runtime dependencies covered

### Build Logs

Monitor build progress in the Snapcraft dashboard:
- Real-time build logs
- Architecture-specific progress
- Error details and stack traces
- Download progress indicators

## Post-Build Actions

### Automatic (if configured)
- **Store Upload** - Automatically uploads to Snap Store
- **Channel Release** - Releases to specified channel (edge/beta/candidate/stable)

### Manual
- **Download Snap** - Download .snap files for testing
- **Local Testing** - Install and test locally before store release
- **Channel Promotion** - Promote from edge → beta → candidate → stable

## Release Workflow

### Recommended Process
1. **Development** - Make changes locally
2. **Commit & Push** - Push to GitHub main/master branch
3. **Trigger Build** - Use Snapcraft dashboard
4. **Test Edge** - Automatic release to edge channel
5. **Promote** - edge → beta → candidate → stable

### Version Management
Use the automated version bump scripts:
```bash
npm run release:patch  # Auto-bump, commit, tag, push, build
npm run release:minor  # Minor version release
npm run release:major  # Major version release
```

## Monitoring

### Build Status
- Email notifications on build completion
- Dashboard shows real-time status
- GitHub integration shows build status

### Store Metrics
- Download statistics
- User ratings and reviews
- Architecture distribution
- Geographic usage data

## Best Practices

1. **Test Locally First** - Use `snapcraft` locally before triggering remote builds
2. **Incremental Changes** - Small, focused commits for easier debugging
3. **Monitor All Architectures** - Some architectures may have specific issues
4. **Use Staging** - Test in edge/beta channels before stable release
5. **Version Consistency** - Keep package.json and snapcraft.yaml versions in sync

## Support

For build issues:
1. Check build logs in Snapcraft dashboard
2. Review this documentation
3. Check GitHub issues
4. Contact Snapcraft support if needed

The configuration is optimized for reliability and should handle most common build scenarios automatically.
