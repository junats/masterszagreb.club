#!/bin/sh

# Fail on error
set -e

# Navigate to project root
cd ../../../

echo "==> Installing Node via Homebrew..."
brew install node

echo "==> Installing project dependencies..."
npm install

echo "==> Syncing Capacitor iOS project (this runs pod install)..."
npx cap sync ios

echo "==> ci_post_clone.sh complete!"
