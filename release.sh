#!/bin/bash

set -e

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$BRANCH" == "main" ]; then
  MODE="LIVE"
  TAG_SUFFIX=""
  echo "📡 Target: LIVE DASHBOARD (Branch: $BRANCH)"
else
  MODE="STAGING"
  TAG_SUFFIX="-staging"
  echo "🛠 Target: STAGING DASHBOARD (Branch: $BRANCH)"
fi

# Get latest tag for this mode (filter by suffix)
if [ "$MODE" == "LIVE" ]; then
  LATEST_TAG=$(git tag -l "v*" | grep -v "staging" | sort -V | tail -n 1 || echo "")
else
  LATEST_TAG=$(git tag -l "v*-staging" | sort -V | tail -n 1 || echo "")
fi

if [ -z "$LATEST_TAG" ]; then
  NEW_VERSION="1.0.0"
else
  # Remove 'v' prefix and suffix
  VERSION=${LATEST_TAG#v}
  VERSION=${VERSION%-staging}

  IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"
  PATCH=$((PATCH + 1))
  NEW_VERSION="$MAJOR.$MINOR.$PATCH"
fi

FINAL_TAG="v$NEW_VERSION$TAG_SUFFIX"

echo "🔢 New $MODE version: $NEW_VERSION"
echo "🔖 Final Tag: $FINAL_TAG"

# Check clean working directory
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ You have uncommitted changes. Commit them first."
  exit 1
fi

# Push latest branch
echo "🚀 Pushing code to $BRANCH..."
git push origin HEAD

# Create new tag
echo "🏷 Creating tag $FINAL_TAG"
git tag -a "$FINAL_TAG" -m "$MODE Release $NEW_VERSION"

# Push tag
echo "📤 Pushing tag..."
git push origin "$FINAL_TAG"

echo "✅ $MODE Release $FINAL_TAG triggered. Jenkins will deploy to $([ "$MODE" == "LIVE" ] && echo "LIVE" || echo "STAGING") environment."
