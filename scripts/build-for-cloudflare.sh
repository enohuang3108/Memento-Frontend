#!/bin/bash

BRANCH="$CF_PAGES_COMMIT_REF"

echo "CF_PAGES_BRANCH: $CF_PAGES_BRANCH"
echo "CF_PAGES_COMMIT_REF: $CF_PAGES_COMMIT_REF"
echo "CF_PAGES_GIT_BRANCH: $CF_PAGES_GIT_BRANCH"
echo "GITHUB_REF_NAME: $GITHUB_REF_NAME"

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "Building for production (branch: $BRANCH)"
  pnpm run build:production

elif [ "$BRANCH" = "beta" ]; then
  echo "Building for beta (branch: $BRANCH)"
  pnpm run build:beta

else
  echo "Building for preview (branch: $BRANCH)"
  pnpm run build:beta
fi
