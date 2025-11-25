#!/bin/bash

# Ensure we are in the project directory
cd "$(dirname "$0")"

echo "📱 Setting up TrueTrack for Mobile..."

# 1. Install Capacitor dependencies
echo "📦 Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# 2. Initialize Capacitor Platforms
echo "🔧 Initializing Android and iOS platforms..."
# Check if android folder exists
if [ ! -d "android" ]; then
    npx cap add android
else
    echo "  - Android platform already exists."
fi

# Check if ios folder exists
if [ ! -d "ios" ]; then
    npx cap add ios
else
    echo "  - iOS platform already exists."
fi

# 3. Build the Web App
echo "🏗️  Building web assets..."
npm run build

# 4. Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync

echo "✅ Setup Complete!"
echo ""
echo "To open the project in Android Studio:"
echo "  npx cap open android"
echo ""
echo "To open the project in Xcode:"
echo "  npx cap open ios"
