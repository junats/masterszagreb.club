#!/bin/sh

# Fail on error
set -e

# Navigate to project root
cd ../../../

echo "==> Installing Node via Homebrew..."
brew install node

echo "==> Installing project dependencies..."
npm install

echo "==> Building frontend and syncing Capacitor iOS project..."
npm run build:mobile

echo "==> ci_post_clone.sh complete!"
