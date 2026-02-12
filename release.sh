#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Usage: ./release.sh 1.0.7"
  exit 1
fi

VERSION=$1
TAG="v$VERSION"

# Check if working tree is clean
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ You have uncommitted changes. Commit them first."
  exit 1
fi

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "❌ Tag $TAG already exists."
  exit 1
fi

echo "🚀 Pushing latest code..."
git push origin HEAD

echo "🏷 Creating tag $TAG..."
git tag -a "$TAG" -m "Release $VERSION"

echo "📤 Pushing tag..."
git push origin "$TAG"

echo "✅ Release $TAG triggered. Jenkins will build & deploy."
