# 🌱 VF Eco Engine

> The Green Heart of Vegan Web3

Core infrastructure for Vegan Friends DAO. Built on NEAR Protocol with OnSocial contracts.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![NEAR Protocol](https://img.shields.io/badge/NEAR-Protocol-000000?logo=near)](https://near.org)

## 🌿 About

VF Eco Engine provides decentralized infrastructure for the vegan community:

- 🌐 **Transparent Vegan Economy** - Track and verify sustainable products
- 🔐 **Wallet-Based Authentication** - Built on NEAR Protocol
- 💚 **Community Rewards** - Earn tokens and badges for verification
- 🛒 **NFT Marketplace** - Trade product certificates and community badges
- � **Impact Tracking** - Measure participation and verification metrics

## 🏗️ Project Structure

```
vfdao-eco-engine/
├── packages/
│   ├── vf-portal/          # Marketing website & community hub
│   └── vf-app/             # Consumer dashboard & product verification
├── contracts/
│   └── vf-staking/         # Staking and verification contracts
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/VF-DAO/vfdao-eco-engine.git
cd vfdao-eco-engine

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📦 Packages

### VF Portal
Marketing website and community hub for Vegan Friends DAO. Learn about stakeholders, explore use cases, and engage with the community.

```bash
cd packages/vf-portal
pnpm dev   # Runs on http://localhost:3000
```

**Features:**
- 🎯 Hero landing page with stakeholder information
- 📚 Educational content about the vegan economy
- 🗺️ Use case explorer
- 📅 Timeline and roadmap
- 🤝 Community engagement hub

### VF App
Consumer dashboard for product verification, rewards tracking, and NFT marketplace access. Requires wallet authentication.

```bash
cd packages/vf-app
pnpm dev   # Runs on http://localhost:3001
```

**Features:**
- 🔐 NEAR wallet authentication
- 📱 Product QR code scanner
- ✅ Verification history tracking
- 🏆 Rewards and badges system
- 🎨 NFT marketplace (coming soon)
- 📊 Consumer statistics dashboard

## 🔗 Running Both Apps

```bash
# Install all dependencies
pnpm install

# Start both development servers
pnpm dev

# Access:
# - Portal: http://localhost:3000
# - App: http://localhost:3001
```

## 🤝 Contributing

We welcome contributions from all builders! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **Website**: [vfdao.org](https://vfdao.org) (coming soon)
- **GitHub**: [github.com/VF-DAO](https://github.com/VF-DAO)
- **Built with**: [OnSocial Protocol](https://github.com/OnSocial-Labs/onsocial-protocol)

---

Built with 💚 by VFDAO Builders
