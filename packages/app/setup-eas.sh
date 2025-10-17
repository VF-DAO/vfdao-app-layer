#!/bin/bash
# Quick setup script for EAS Build

set -e

echo "🚀 EAS Build Setup for VF Eco Engine"
echo "======================================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

echo "✅ EAS CLI is installed"
echo ""

# Check if logged in
if ! eas whoami &> /dev/null; then
    echo "🔐 Please log in to Expo/EAS"
    echo "Visit: https://expo.dev to create an account"
    eas login
else
    echo "✅ Already logged in to EAS"
    eas whoami
fi

echo ""
echo "📱 Ready to build! Run:"
echo "   eas build --platform android --profile development"
echo ""
echo "📚 For more info, see: EAS_BUILD_SETUP.md"
