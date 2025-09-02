#!/bin/bash

# Version bump script for kesty-whatsapp
# Usage: ./scripts/bump-version.sh [major|minor|patch] [--auto]
# Default: patch
# --auto: Automatically commit, tag, push, and build

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR"

# Parse arguments
BUMP_TYPE="patch"
AUTO_MODE=""

for arg in "$@"; do
    case $arg in
        major|minor|patch)
            BUMP_TYPE="$arg"
            ;;
        --auto|-a)
            AUTO_MODE="--auto"
            ;;
        --help|-h)
            echo "Version Bump Script for kesty-whatsapp"
            echo ""
            echo "Usage: $0 [major|minor|patch] [--auto]"
            echo ""
            echo "Arguments:"
            echo "  major    Bump major version (1.2.3 → 2.0.0)"
            echo "  minor    Bump minor version (1.2.3 → 1.3.0)"
            echo "  patch    Bump patch version (1.2.3 → 1.2.4) [default]"
            echo "  --auto   Automatically commit, tag, push, and build"
            echo ""
            echo "Examples:"
            echo "  $0 patch"
            echo "  $0 minor --auto"
            echo "  npm run version:patch"
            echo "  npm run version:minor"
            exit 0
            ;;
        *)
            echo "❌ Invalid argument: $arg"
            echo "Usage: $0 [major|minor|patch] [--auto]"
            exit 1
            ;;
    esac
done

echo "🚀 Running version bump script..."
if [[ -n "$AUTO_MODE" ]]; then
    echo "🤖 Auto mode enabled - will commit, tag, push, and build automatically"
fi
echo ""

# Run the Node.js script
node scripts/bump-version.js "$BUMP_TYPE" $AUTO_MODE

echo ""
echo "🎯 Available commands:"
echo "   npm run version:patch        # Bump patch version (1.2.3 → 1.2.4)"
echo "   npm run version:minor        # Bump minor version (1.2.3 → 1.3.0)"
echo "   npm run version:major        # Bump major version (1.2.3 → 2.0.0)"
echo "   ./scripts/bump-version.sh patch --auto  # Auto commit, tag, push & build"
