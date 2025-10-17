# 🌱 VF Eco App

Consumer dashboard for Vegan Friends DAO - Product verification, rewards tracking, and NFT marketplace on NEAR Protocol.

Built with **Expo** for iOS, Android, and Web from a single codebase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies from workspace root
cd /home/greenx/vfdao-eco-engine
pnpm install

# Start development
pnpm dev
```

The app will run on:
- **Web**: http://localhost:3001 (if expo web is configured)
- **Mobile**: Use Expo Go or emulators (iOS/Android)

### Platform-Specific Commands

```bash
# From app directory
cd packages/app

# Web development
npm run web

# iOS development (requires macOS)
npm run ios

# Android development
npm run android

# General development (choose platform)
npm start
```

## 📱 Features

- **Wallet Authentication** - NEAR Protocol wallet connection with HERE Wallet
- **Product Scanning** - QR code scanner for verification (placeholder)
- **Verification History** - Track verified products
- **Rewards System** - Earn badges and tokens
- **NFT Marketplace** - Trade product certificates (coming soon)
- **Dark/Light Mode** - Theme support across all platforms

## 🎨 Design System

Shared color scheme with vf-portal:
- **Primary Green**: #9DC491 (Light Sage Green)
- **Accent Yellow**: #F6C638 (Verified)
- **Background**: #0A0A0A (Premium Black)

## 🔗 Architecture

- `app/(tabs)` - Main navigation screens
- `contexts/` - React context providers (wallet, theme)
- `constants/` - Design tokens and colors
- `components/` - Reusable UI components
- `hooks/` - Custom React hooks

## 🛠️ Technology Stack

- **Framework**: Expo 54 + React Native 0.81
- **Language**: TypeScript
- **Routing**: Expo Router
- **Styling**: React Native StyleSheet + Nativewind
- **Wallet**: HERE Wallet (@here-wallet/core)
- **State**: React Context API
