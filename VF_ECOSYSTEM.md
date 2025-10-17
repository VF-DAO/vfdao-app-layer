# VF Ecosystem: Portal vs App

## The Big Picture

VeganFriends DAO has **two complementary applications**:

### 🌐 vf-portal (Marketing)
**Purpose:** Educate, inspire, convert  
**URL:** `https://veganfriends.dao` (port 3000)  
**Users:** Everyone (public)

**Contains:**
- Landing pages
- "Why we exist" story
- Product verification timeline
- Real-world example (Alice's cocoa farm)
- Stakeholder cards (consumer, producer, brand, certifier)
- Use cases
- Journey ahead timeline
- Community call-to-action
- Call-to-action: "Join Waitlist", "Join Community"

**Goal:** Drive awareness and get people interested in participation

---

### 💻 vf-app (Dashboard)
**Purpose:** User functionality, verification, rewards  
**URL:** `https://app.veganfriends.dao` (port 3001)  
**Users:** Authenticated via wallet

**Contains:**
- Consumer dashboard with stats
- Product verification scanner
- Verification history
- Achievement badges & rewards tracking
- NFT marketplace (coming soon)
- Community features (coming soon)

**Goal:** Enable meaningful participation and build network effects

---

## User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  User discovers VF DAO                                       │
│  (organic, social, partnerships)                             │
│           ↓                                                   │
│  ┌─────────────────────┐                                      │
│  │   vf-portal         │  Learns:                             │
│  │  (3000)             │  • What is VF DAO?                  │
│  │                     │  • How does it work?                │
│  │  • Landing page     │  • Real stories                     │
│  │  • Timeline         │  • Use cases                        │
│  │  • Community info   │  • Where to go next                 │
│  └─────────────────────┘                                      │
│           ↓                                                   │
│  "Join the Movement" / "Get Early Access"                    │
│  (buttons point to Telegram or App)                          │
│           ↓                                                   │
│  ┌─────────────────────┐                                      │
│  │   vf-app            │  Does:                              │
│  │  (3001)             │  • Connect wallet                   │
│  │                     │  • Scan products                    │
│  │  • Dashboard        │  • Earn rewards                     │
│  │  • Scanner          │  • See achievements                 │
│  │  • History          │  • Join community                   │
│  │  • Marketplace      │  • Trade NFTs                       │
│  └─────────────────────┘                                      │
│           ↓                                                   │
│  Repeat: Verify products → Earn $VF → Build reputation      │
│           ↓                                                   │
│  Network grows → More products verified → More value         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Detailed User Flows

### 🆕 New Consumer Discovery

```
1. User sees social post / blog about VF DAO
2. Clicks link → vf-portal (3000)
3. Reads "Don't trust. It's already verified"
4. Sees Alice's cocoa farm story
5. Clicks "Join the Movement" button
6. Redirected to vf-app (3001)
7. Sees "Connect Wallet" onboarding
8. Signs with NEAR wallet
9. Enters dashboard
10. Starts scanning products!
```

### ✅ Product Verification

```
1. Consumer scans QR code in store
2. vf-app sends to blockchain indexer
3. Shows complete supply chain:
   - Farmer info + location
   - Certifier verification badge
   - Processing records
   - Transport chain
4. User sees "Verified ✓"
5. Gets $VF token reward
6. Achievement added to history
7. Can share on social
```

### 🏪 Stakeholder-Specific Flows (Future)

**Producer Portal (vf-app):**
```
1. Alice logs in with wallet
2. Goes to "Producer Dashboard"
3. Records harvest
4. Submits for certification
5. Gets verified badge
6. Earns $VF tokens
7. Gets connected to brands
```

**Brand Portal (vf-app):**
```
1. Chocolate company logs in
2. Goes to "Brand Dashboard"
3. Adds products
4. Links to verified ingredients
5. Gets "100% Verified" badge
6. Can showcase on store packaging
```

**Certifier Portal (vf-app):**
```
1. Vegan Society logs in
2. Goes to "Certifier Dashboard"
3. Sees pending certifications
4. Reviews supply chain
5. Issues digital certificate (NFT)
6. Gets paid in $VF
```

---

## Information Architecture

### vf-portal Pages
```
/ (home/hero)
├── #learn-more (stakeholder cards)
├── #use-cases (real scenarios)
├── #timeline (journey ahead)
├── #community (join section)
└── Footer (links + social)
```

### vf-app Routes
```
/ (onboarding/login)
├── /dashboard (protected - consumer home)
│   ├── /dashboard/scanner (product QR scanner)
│   └── /dashboard/history (verification log)
├── /marketplace (NFT trading)
├── /producer (future - producer dashboard)
├── /brand (future - brand dashboard)
└── /certifier (future - certifier dashboard)
```

---

## Design Consistency

Both apps share:
- **Color scheme:** Primary green (#9dc491), dark backgrounds
- **Typography:** Inter font family
- **Component library:** Tailwind + Lucide icons
- **Theme system:** Dark/light mode support
- **Code structure:** TypeScript, Next.js

This creates:
✅ Unified brand experience  
✅ Faster development (shared components coming)  
✅ Consistent UX across properties  
✅ Professional appearance  

---

## Data Flow

### vf-portal (Static/Dynamic)
```
Content → React Components → Browser
```

### vf-app (Dynamic/Interactive)
```
User Wallet → NEAR Network → Smart Contracts
                    ↓
          Blockchain Data (Substreams)
                    ↓
            GraphQL API
                    ↓
          React Components
                    ↓
          User Dashboard
```

---

## Current Status

### vf-portal ✅
- **Live and complete**
- Modern landing page
- All content in place
- Links working
- Telegram integration ready

### vf-app 🚀
- **Foundation complete**
- Structure in place
- UI/UX ready
- Awaiting wallet integration
- Smart contract hookup coming Q1 2026

---

## Timeline

### Q4 2025 (Now)
- ✅ vf-portal optimized
- ✅ vf-app foundation
- Wallet integration planning

### Q1 2026
- Smart contracts launch
- Wallet integration
- Product verification live
- First rewards issued

### Q2 2026
- Full marketplace
- Multi-stakeholder portals
- Community features
- Advanced analytics

### Q3-Q4 2026
- Mobile apps
- International expansion
- Ecosystem partners
- Consumer app marketing

---

## Why This Architecture?

### Problem with Single App
❌ Marketing clutter with complex features  
❌ Can't optimize for both purposes  
❌ Slow user experience  
❌ Confusing UX  

### Solution: Two Focused Apps
✅ vf-portal = Education focused  
✅ vf-app = Function focused  
✅ Fast, purposeful experiences  
✅ Clear user journeys  
✅ Scalable architecture  
✅ Future stakeholder portals simple  

---

## Next Immediate Actions

1. **Test both apps locally**
   ```bash
   pnpm dev
   ```

2. **Integrate vf-portal → vf-app links**
   - Update CTA buttons
   - Add app navigation

3. **Build wallet integration**
   - NEAR wallet connection
   - Session management

4. **Connect smart contracts**
   - vf-staking integration
   - Rewards calculation

---

## Success Metrics

### vf-portal Success
- Traffic from social/organic
- Time on site
- Click-through to app
- Community growth (Telegram)

### vf-app Success
- Wallet connections
- Products scanned
- $VF tokens distributed
- Active users
- Repeat verification rate

---

**This is a cohesive ecosystem designed to scale from passionate community to global standard.**

💚 Built by vegans, for vegans.
