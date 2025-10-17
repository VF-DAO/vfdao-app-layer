# VF App

The consumer-focused dashboard for VeganFriends DAO. Users connect their NEAR wallet and verify products while earning $VF tokens and badges.

## 🚀 Features

### Phase 1 (Current)
- **Wallet-only authentication** via NEAR Protocol
- **Consumer dashboard** with stats and activity tracking
- **Product verification history** (placeholder)
- **Product scanner** (placeholder for QR code scanning)
- **NFT marketplace skeleton** (placeholder for future features)
- **Responsive design** matching vf-portal theming

### Phase 2 (Q1 2026)
- Functional product QR scanning
- Integration with smart contracts
- Real-time verification results
- Rewards tracking and claiming

### Phase 3 (Q2 2026)
- Full NFT marketplace
- Community features
- Advanced analytics

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev
```

The app runs on `http://localhost:3001`

## 🏗️ Architecture

```
src/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Onboarding/login
│   ├── dashboard/           # Protected dashboard routes
│   │   ├── layout.tsx       # Dashboard sidebar layout
│   │   ├── page.tsx         # Main consumer dashboard
│   │   ├── scanner/         # Product scanner
│   │   └── history/         # Verification history
│   └── marketplace/         # NFT marketplace (placeholder)
├── components/
│   └── providers/           # Theme provider
├── contexts/                # Wallet context (coming soon)
└── lib/                     # Utilities
```

## 🎨 Design System

Shares design tokens with vf-portal:
- **Colors:** Primary green (#9dc491), verified green
- **Typography:** Inter font family
- **Theme:** Dark mode by default, light mode support
- **Icons:** Lucide React

## 🔐 Authentication

- **Wallet-only:** NEAR Protocol wallet connection
- **No email/social:** Clean, crypto-native experience
- **Session persistence:** Via wallet signature

## 🔌 Integrations (Coming Soon)

- **NEAR Wallet Kit:** Wallet connection
- **Smart Contracts:** vf-staking contract integration
- **Substreams:** Blockchain data indexing

## 📱 Responsive

- Mobile-first design
- Tested on small, medium, and large screens
- Touch-friendly UI elements

## 🧪 Development

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Build
pnpm build

# Production start
pnpm start
```

## 📝 Notes

- This is an early-stage consumer portal
- Design and functionality will evolve based on user feedback
- Integration with smart contracts pending Q1 2026 mainnet launch

---

**Made with 💚 by VeganFriends DAO**
