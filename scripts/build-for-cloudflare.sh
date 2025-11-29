#!/bin/bash

BRANCH="$CF_PAGES_COMMIT_REF"

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
