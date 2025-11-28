#!/bin/bash

# 根據 Cloudflare Pages 提供的環境變數來決定使用哪個 mode
# CF_PAGES_BRANCH 是 Cloudflare Pages 自動提供的環境變數

if [ "$CF_PAGES_BRANCH" = "main" ] || [ "$CF_PAGES_BRANCH" = "master" ]; then
  echo "Building for production (branch: $CF_PAGES_BRANCH)"
  pnpm run build:production
elif [ "$CF_PAGES_BRANCH" = "beta" ]; then
  echo "Building for beta (branch: $CF_PAGES_BRANCH)"
  pnpm run build:beta
else
  echo "Building for preview (branch: $CF_PAGES_BRANCH)"
  pnpm run build:beta
fi
