#!/bin/bash

# Function to handle errors
handle_error() {
  echo "Error: $1"
  exit 1
}

# Initialize default values
VERSION_NUMBER=""
SHOULD_TAG_PROJECTS="true"
USE_LIGHT_TAGS="true"
# These were in your Flutter script, adapted here as environment variables if needed
USE_ODOO_DEV="false"
USE_GRAPHQL_STAGING="false"
TAG_NAME=""

# Generate a random number to append
RANDOM_SUFFIX=$RANDOM

# Parse named parameters
while [[ $# -gt 0 ]]; do
  case $1 in
    --version)
      VERSION_NUMBER="$2"
      shift 2  # Shift past argument and value
      ;;
    --tag)
      TAG_NAME="$2"
      shift 2
      ;;
    *)
      echo "Unknown parameter: $1"
      exit 1
      ;;
  esac
done

# Ensure version number is provided
if [ -z "$VERSION_NUMBER" ]; then
  echo "Error: --version is required."
  exit 1
fi

echo "VERSION_NUMBER: $VERSION_NUMBER"
echo "RANDOM_SUFFIX: $RANDOM_SUFFIX"

if [ -n "$TAG_NAME" ]; then
  echo "Tagging enabled with TAG_NAME: $TAG_NAME"
else
  echo "Tagging is skipped as no --tag parameter was provided."
fi

echo "Using Dev ODOO: $USE_ODOO_DEV"
echo "Using Staging GRAPHQL: $USE_GRAPHQL_STAGING"

# Update dependencies
echo "Cleaning and installing dependencies..."
rm -rf build
npm install

# In your Flutter script you had:
# dart pub upgrade dashboard_project metrics_dashboardtv pf_reports farm_management_dashboard
# If you have local npm packages to update, add them here.
# npm update package-name

# Run React build
echo "Running React build..."
# We map the variables to REACT_APP_ prefix so they are available in the React app
REACT_APP_VERSION=$VERSION_NUMBER \
REACT_APP_TAG=$TAG_NAME \
REACT_APP_USE_ODOO_DEV=$USE_ODOO_DEV \
REACT_APP_USE_GRAPHQL_STAGING=$USE_GRAPHQL_STAGING \
npm run build

if [ $? -ne 0 ]; then
  echo "Build failed!"
  exit 1
fi

# Change to the build directory
cd build || handle_error "Failed to change directory to build"

# Modify files for versioning if necessary. 
# For React (CRA), files are already hashed, but we can add a version comment or meta tag to index.html
sed -i.bak "s|</head>|<meta name=\"version\" content=\"$VERSION_NUMBER-$RANDOM_SUFFIX-$TAG_NAME\"></head>|g" index.html || handle_error "Failed to modify index.html"

echo "Build and versioning completed successfully!"

cd ..
echo "PWD: $(pwd)"

# Tagging functionality (only if TAG_NAME is provided)
if [ -n "$TAG_NAME" ] && [ -d ".git" ]; then
  branch_name=$(git rev-parse --abbrev-ref HEAD)

  if [ "$USE_LIGHT_TAGS" = true ]; then
    git tag -f "$TAG_NAME"
    echo "Lightweight tag $TAG_NAME created (forced if exists)"
  else
    git tag -a "$TAG_NAME" -m "Release version $VERSION_NUMBER-$RANDOM_SUFFIX  Odoo Dev: $USE_ODOO_DEV GraphQL Staging: $USE_GRAPHQL_STAGING"
    echo "Annotated tag $TAG_NAME created"
  fi

  git push origin "$TAG_NAME" --force
  echo "Tag $TAG_NAME pushed to branch $branch_name"
else
  echo "Skipping tagging process."
fi
