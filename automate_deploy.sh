#!/bin/bash

# Function to handle errors
handle_error() {
  echo "❌ Error: $1"
  exit 1
}

# Read configuration from automation_config.json
CONFIG_FILE="automation_config.json"

# Explicitly define the JQ path
JQ_PATH="/usr/bin/jq"

# Check if jq exists and is executable
if [ ! -x "$JQ_PATH" ]; then
    echo "⚠️ Warning: 'jq' is not installed or not executable at $JQ_PATH. Skipping deployment."
    exit 1
fi

# Add /usr/bin and /usr/local/bin to PATH in case jq is not in PATH
export PATH=$PATH:/usr/bin:/usr/local/bin

# Extract values from JSON using explicit jq path
DEPLOY_NOW=$("$JQ_PATH" -r '.deploy_now' "$CONFIG_FILE")
VERSION_NUMBER=$("$JQ_PATH" -r '.version' "$CONFIG_FILE")
TAG_NAME=$("$JQ_PATH" -r '.tag_name' "$CONFIG_FILE")

# Check deploy_now flag
if [ "$DEPLOY_NOW" != "true" ]; then
    echo "ℹ️ Deployment skipped as deploy_now is set to false."
    exit 0
fi

# Ensure version number is provided
if [ -z "$VERSION_NUMBER" ]; then
    handle_error "--version is required in automation_config.json."
fi

# Run web_build.sh with Bash
if [ -n "$TAG_NAME" ]; then
    echo "🚀 Running: bash web_build.sh --version \"$VERSION_NUMBER\" --tag \"$TAG_NAME\""
    bash web_build.sh --version "$VERSION_NUMBER" --tag "$TAG_NAME"
else
    echo "🚀 Running: bash web_build.sh --version \"$VERSION_NUMBER\""
    bash web_build.sh --version "$VERSION_NUMBER"
fi

# Check if the build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build process completed successfully!"

    # Set deploy_now to false in automation_config.json
    "$JQ_PATH" '.deploy_now = false' "$CONFIG_FILE" > tmp_config.json && mv tmp_config.json "$CONFIG_FILE"
    if [ $? -eq 0 ]; then
        echo "📌 Updated automation_config.json: deploy_now set to false."
    else
        handle_error "Failed to update automation_config.json."
    fi
else
    handle_error "Build failed!"
fi
