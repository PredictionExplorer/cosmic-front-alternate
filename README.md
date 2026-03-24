# Cosmic Signature - Premium NFT Auction Game Website

A world-class, luxury-focused website for the Cosmic Signature blockchain game. Built with modern web technologies and designed to showcase premium NFT art while explaining sophisticated game mechanics.

## 🎨 Design Philosophy

**"Museum by day, auction house by night"**

This website balances two core objectives:

1. **Showcase exceptional NFT art** with museum-quality presentation
2. **Explain complex game mechanics** with clarity and elegance

The design embodies luxury through:

-   Generous whitespace and refined typography
-   Sophisticated dark color palette with gold/platinum accents
-   Subtle, purposeful animations (never flashy)
-   Premium glass morphism effects
-   Meticulous attention to micro-interactions

## 🚀 Tech Stack

-   **Framework**: Next.js 14 (App Router, React Server Components)
-   **Language**: TypeScript (strict mode)
-   **Styling**: Tailwind CSS 3.4+ with custom luxury theme
-   **Animations**: Framer Motion
-   **UI Components**: Radix UI (accessible primitives)
-   **Icons**: Lucide React
-   **State Management**: Zustand (when needed)
-   **Fonts**:
    -   Cormorant Garamond (serif, headings)
    -   Inter (sans-serif, body)
    -   Space Grotesk (monospace, numbers/data)

## 📦 Installation

```bash
npm install
```

## 🛠️ Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

With Turbopack (faster):

```bash
npm run dev --turbo
```

## 🏗️ Build

```bash
npm run build
npm run start
```

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                 # Landing page
│   ├── gallery/                 # NFT gallery
│   │   ├── page.tsx            # Gallery grid/list
│   │   └── [id]/page.tsx       # Individual NFT detail
│   ├── game/                    # Game pages
│   │   ├── play/               # Main game dashboard
│   │   ├── how-it-works/       # Mechanics explanation
│   │   ├── prizes/             # Prize structure
│   │   └── leaderboard/        # Rankings
│   ├── stake/                   # NFT staking
│   ├── about/                   # About the project
│   ├── layout.tsx               # Root layout with fonts
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Container.tsx
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── game/                    # Game-specific components
│   │   ├── CountdownTimer.tsx
│   │   └── StatCard.tsx
│   └── nft/                     # NFT-related components
│       └── NFTCard.tsx
├── lib/
│   ├── utils.ts                 # Utility functions
│   └── constants.ts             # Game constants & mock data
└── types/
    └── index.ts                 # TypeScript type definitions
```

## 🎨 Color Palette

### Primary Palette

-   **Background**: `#0A0A0B` (Deep charcoal)
-   **Surface**: `#151518` (Elevated dark)
-   **Primary**: `#D4AF37` (Champagne gold)
-   **Platinum**: `#E5E4E2` (Platinum accent)
-   **Text Primary**: `#F5F5F0` (Warm white)
-   **Text Secondary**: `#A8A8A0` (Soft gray)

### Functional Colors

-   **Success**: `#2D8659` (Muted emerald)
-   **Warning**: `#D97706` (Amber)
-   **Error**: `#991B1B` (Burgundy)
-   **Info**: `#475569` (Slate blue)

## 🎯 Key Features

### Web3 Integration

-   **Multi-Wallet Support**: MetaMask, Coinbase, WalletConnect, Rainbow, and 300+ wallets via RainbowKit
-   **Automatic Network Switching**: Automatically prompts users to switch to the correct network when they access the site
-   **Smart Network Detection**: Detects wrong network and guides users through switching
-   **Multi-Network Support**: Local Testnet, Arbitrum Sepolia, and Arbitrum One
-   **Beautiful Wallet UI**: Luxury-themed connection modal with smooth animations
-   **Transaction Status**: Real-time transaction tracking and status updates

### Landing Page

-   Elegant hero with animated gradient backgrounds
-   Live round status with countdown timer
-   Featured NFT showcase
-   Three-pillar value proposition
-   Prize distribution preview
-   Clear CTAs for all user journeys

### Gallery

-   Grid and list view modes
-   Real-time search and filtering
-   Sort by newest, oldest, or token ID
-   Smooth animations and transitions
-   Individual NFT detail pages with full metadata
-   Video playback support

### Game Dashboard (`/game/play`)

-   Live countdown timer with urgency states
-   Real-time bid price display (ETH & CST)
-   Dutch auction progress visualization
-   Bid form with validation
-   Random Walk NFT discount toggle
-   Current champions display
-   Recent bids feed
-   Your stats tracking

### How It Works (`/game/how-it-works`)

-   Progressive disclosure with accordions
-   Clear explanations of complex mechanics
-   Visual examples and diagrams
-   Championship paths explained
-   Pro tips and strategies

### Prize Structure (`/game/prizes`)

-   Visual flow diagram of distribution
-   Detailed breakdown for each prize type
-   Claiming instructions
-   Percentage allocations

### Leaderboard (`/game/leaderboard`)

-   Top 3 podium display
-   Full rankings table
-   Filter by timeframe and category
-   Sortable columns

### Staking (`/stake`)

-   Tabbed interface (Cosmic vs Random Walk)
-   Staking stats overview
-   Your NFTs management
-   Detailed reward calculations
-   Comprehensive FAQ

### About (`/about`)

-   Project concept and vision
-   NFT generation explanation
-   Smart contract addresses
-   Security and audit information
-   Community links

## 🔧 Customization

### Updating Mock Data

Mock data is located in `src/lib/constants.ts`:

-   `MOCK_CURRENT_ROUND` - Current round state
-   `MOCK_NFTS` - NFT collection
-   `GAME_CONSTANTS` - Game configuration

### Connecting to Blockchain

To connect real blockchain data (future):

1. Install Web3 libraries: `wagmi`, `viem`, `@tanstack/react-query`
2. Create hooks in `src/lib/hooks/`
3. Replace mock data with contract reads
4. Implement wallet connection
5. Add transaction handling

### Styling

Tailwind configuration in `tailwind.config.ts`:

-   Extend color palette
-   Add custom animations
-   Modify breakpoints
-   Add custom utilities

## 📱 Responsive Design

Fully responsive with breakpoints:

-   **Mobile**: 640px+
-   **Tablet**: 768px+
-   **Desktop**: 1024px+
-   **Large**: 1280px+

Mobile-specific optimizations:

-   Hamburger menu navigation
-   Simplified hero animations
-   Single-column layouts
-   Touch-optimized interactions

## ♿ Accessibility

Built with accessibility in mind:

-   Semantic HTML throughout
-   ARIA labels where needed
-   Keyboard navigation support
-   Focus indicators on all interactive elements
-   Radix UI for accessible primitives
-   Color contrast ratios meet WCAG AA standards
-   Reduced motion support

## 🚀 Performance

Optimizations implemented:

-   Next.js automatic code splitting
-   Image optimization with next/image
-   Font optimization with next/font
-   Lazy loading for below-fold content
-   Minimal JavaScript bundle
-   Server-side rendering where appropriate
-   Prefetching for faster navigation

## 🧪 Scripts

```bash
# Development
npm run dev          # Start dev server
npm run dev --turbo  # Start with Turbopack

# Building
npm run build        # Production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Generate placeholder NFTs
node scripts/generate-placeholders.js
```

## 📝 Environment Variables

Same **required** variable names as the blue (cosmicgame) frontend:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_NETWORK` | `local` \| `sepolia` \| `mainnet` — default chain for the app |
| `NEXT_PUBLIC_API_URL` | Cosmic Game API base URL (e.g. `https://example.com/api/cosmicgame/`) |
| `NEXT_PUBLIC_RPC_URL` | JSON-RPC URL for the chain above (HTTPS recommended in production) |

Create `.env.local` for local development (see `.env.example`):

```env
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_API_URL=https://your-api.example.com/api/cosmicgame/
NEXT_PUBLIC_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# WalletConnect (recommended for WalletConnect / mobile)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional
# NEXT_PUBLIC_SENTRY_DSN=
# NEXT_PUBLIC_ASSETS_BASE_URL=https://nfts.cosmicsignature.com/
```

### Network Options

| Value | Network | Chain ID | Description |
|-------|---------|----------|-------------|
| `local` | Local Testnet | 31337 | Local development testnet |
| `sepolia` | Arbitrum Sepolia | 421614 | Arbitrum testnet |
| `mainnet` | Arbitrum One | 42161 | Arbitrum mainnet |

## 🎯 Development Roadmap

### Phase 1: Static Website ✅

-   [x] Landing page with hero and key sections
-   [x] Gallery with grid/list views
-   [x] Game dashboard layout
-   [x] How it works explanations
-   [x] Prize structure page
-   [x] Leaderboard
-   [x] Staking interface
-   [x] About page
-   [x] Responsive design
-   [x] Animations and interactions

### Phase 2: Blockchain Integration ✅

-   [x] Wallet connection (RainbowKit)
-   [x] Multi-wallet support (300+ wallets)
-   [x] Automatic network switching
-   [x] Read contract data (wagmi hooks)
-   [x] Transaction handling
-   [x] Real-time updates
-   [x] Network detection and validation
-   [ ] Event listening (in progress)
-   [ ] Advanced user profile data

### Phase 3: Advanced Features

-   [ ] Notification system
-   [ ] Advanced charts/analytics
-   [ ] User preferences/settings
-   [ ] Dark/light mode toggle
-   [ ] Multi-language support

### Phase 4: Polish

-   [ ] Performance optimization
-   [ ] SEO improvements
-   [ ] Accessibility audit
-   [ ] E2E testing
-   [ ] Documentation

## 🎨 Design Principles

1. **Luxury First**: Every element feels premium
2. **Content Hierarchy**: Clear visual hierarchy guides the eye
3. **Generous Whitespace**: Never cramped or cluttered
4. **Purposeful Animation**: Movement enhances, never distracts
5. **Accessible**: Beautiful for everyone
6. **Performance**: Fast load times maintain premium feel

## 📚 Component Library

All components follow these principles:

-   **Composable**: Small, reusable pieces
-   **Accessible**: Built on Radix UI primitives
-   **Typed**: Full TypeScript support
-   **Themeable**: Consistent with design system
-   **Performant**: Optimized for production

## 🤝 Contributing

When adding new features:

1. Follow existing component patterns
2. Maintain luxury aesthetic
3. Ensure responsive design
4. Add proper TypeScript types
5. Test on multiple screen sizes
6. Check accessibility

## 📄 License

[Add appropriate license]

## 🙏 Acknowledgments

-   OpenZeppelin for secure smart contract libraries
-   Arbitrum for scalable infrastructure
-   Radix UI for accessible components
-   Framer Motion for smooth animations

---

Built with ❤️ for the Cosmic Signature community
