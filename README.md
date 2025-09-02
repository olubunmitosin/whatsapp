# Kesty WhatsApp

An unofficial WhatsApp client for Linux distributions built with Electron.

[![kesty-whatsapp](https://snapcraft.io//kesty-whatsapp/badge.svg)](https://snapcraft.io/kesty-whatsapp)

## Features

- Native desktop experience for WhatsApp Web
- Dark/Light theme support
- System notifications
- System tray integration
- Audio/video call support
- Multi-architecture support (amd64, arm64, armhf, ppc64el, s390x)
- Secure and sandboxed via Snap packaging

## Installation

### From Snap Store (Recommended)
```bash
sudo snap install kesty-whatsapp
```

### From Source
To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/olubunmitosin/whatsapp
# Go into the repository
cd whatsapp
# Install dependencies
npm install
# Run the app
npm start
```

## Development

### Available Scripts

```bash
# Development
npm start              # Run the application
npm run dev           # Run with debug logging

# Building
npm run build:snap    # Build snap package locally
npm run build:snap-remote  # Build snap package remotely (recommended)

# Version Management (Manual)
npm run version:patch # Bump patch version (1.2.3 → 1.2.4)
npm run version:minor # Bump minor version (1.2.3 → 1.3.0)
npm run version:major # Bump major version (1.2.3 → 2.0.0)

# Automated Release (Bump + Commit + Tag + Push + Build)
npm run release:patch # Full automated patch release
npm run release:minor # Full automated minor release
npm run release:major # Full automated major release
```

### Version Management

This project includes automated version management scripts with optional full automation:

```bash
# Manual version bump (shows next steps)
npm run version:patch  # 1.2.3 → 1.2.4
npm run version:minor  # 1.2.3 → 1.3.0
npm run version:major  # 1.2.3 → 2.0.0

# Automated release (bumps version + commits + tags + pushes + builds)
npm run release:patch  # Full automated patch release
npm run release:minor  # Full automated minor release
npm run release:major  # Full automated major release

# Or use the shell script directly
./scripts/bump-version.sh patch        # Manual mode
./scripts/bump-version.sh minor --auto # Automated mode
```

**Manual Mode** (default):
- Updates version in `package.json` and `snap/snapcraft.yaml`
- Shows next steps for manual git operations

**Automated Mode** (`--auto` flag):
- Updates version files
- Commits changes: `git add . && git commit -m "Bump version to X.Y.Z"`
- Creates tag: `git tag vX.Y.Z`
- Pushes changes: `git push && git push --tags`
- Builds snap package: `npm run build:snap-remote`

### Building Snap Packages

#### Remote Build (Recommended for macOS/Windows)
```bash
# Install snapcraft
brew install snapcraft  # macOS
# or
sudo apt install snapcraft  # Ubuntu

# Login to snapcraft
snapcraft login

# Build remotely (supports all architectures)
npm run build:snap-remote
```

#### Local Build (Linux only)
```bash
npm run build:snap
```

### Supported Architectures

This application builds for the following architectures:
- **amd64** - 64-bit Intel/AMD processors
- **arm64** - 64-bit ARM processors (Apple Silicon, Raspberry Pi 4+)
- **armhf** - 32-bit ARM processors (Raspberry Pi 2/3)
- **ppc64el** - 64-bit PowerPC processors
- **s390x** - IBM System z processors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[CC0 1.0 (Public Domain)](LICENSE.md)

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/kesty-whatsapp)
