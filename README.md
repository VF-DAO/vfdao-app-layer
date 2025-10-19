# 🌱 VF App Layer

> Frontend infrastructure and user interfaces for Vegan Friends DAO. Built on NEAR Protocol with
> OnSocial contracts.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![NEAR Protocol](https://img.shields.io/badge/NEAR-Protocol-000000?logo=near)](https://near.org)
[![Status](https://img.shields.io/badge/status-in%20development-orange)]()

## 🌿 About

VF App Layer houses all core applications and frontend infrastructure for the Vegan Friends DAO
ecosystem. Planned features include:

- **Transparent Vegan Economy** - Track and verify sustainable products
- **Wallet-Based Authentication** - Built on NEAR Protocol
- **Stakeholder Dashboards** - Personalized interfaces for consumers, producers, and certifiers
- **Community Rewards** - Earn tokens and badges for verification
- **NFT Marketplace** - Trade digital art and collectibles
- **Impact Tracking** - Measure participation and verification metrics

## 🏗️ Project Structure

```
vfdao-app-layer/
├── packages/
│   ├── vf-portal/          # Landing page
│   └── vf-app/             # Interactive app
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/VF-DAO/vfdao-app-layer.git
cd vfdao-app-layer

# Install dependencies
pnpm install

# Start development server
pnpm dev

Visit [http://localhost:3000](http://localhost:3000)
```

## 📦 Packages

### VF Portal

Core hub for ecosystem overview and community engagement.

```bash
cd packages/vf-portal
pnpm dev   # Runs on http://localhost:3000
```

**Features:**

- Hero landing page with stakeholder information
- Educational content about the vegan economy
- Use case explorer
- Timeline and roadmap
- Community engagement hub

### VF App

Consumer dashboard for product verification, rewards tracking, and NFT marketplace access. On-chain
native with wallet authentication.

_Currently in active development with core features being implemented._

```bash
cd packages/vf-app
pnpm dev   # Runs on http://localhost:3001
```

**Features:**

_Most features currently in development_

- NEAR wallet authentication
- Stakeholder dashboards (consumers, producers, certifiers)
- Product verification workflows
- Rewards and badges system
- NFT marketplace
- Analytics and reporting

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
- **GitHub**: [github.com/VF-DAO/vfdao-app-layer](https://github.com/VF-DAO/vfdao-app-layer)
- **Built with**: [OnSocial Protocol](https://github.com/OnSocial-Labs/onsocial-protocol)

---

Built with 💚 by VFDAO Builders
