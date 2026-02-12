#!/bin/bash

set -e

# Get latest tag (if exists)
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -z "$LATEST_TAG" ]; then
  NEW_VERSION="1.0.0"
else
  # Remove 'v' prefix
  VERSION=${LATEST_TAG#v}

  IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

  PATCH=$((PATCH + 1))

  NEW_VERSION="$MAJOR.$MINOR.$PATCH"
fi

TAG="v$NEW_VERSION"

echo "🔢 New version will be: $NEW_VERSION"

# Check clean working directory
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ You have uncommitted changes. Commit them first."
  exit 1
fi

# Push latest branch
echo "🚀 Pushing latest code..."
git push origin HEAD

# Create new tag
echo "🏷 Creating tag $TAG"
git tag -a "$TAG" -m "Release $NEW_VERSION"

# Push tag
echo "📤 Pushing tag..."
git push origin "$TAG"

echo "✅ Release $TAG triggered. Jenkins will build & deploy."
