# Luxury Integration Blueprint: Complete Feature Set

## 🎨 Executive Summary

This document provides a complete blueprint for integrating ALL features from cosmicgame-frontend into cosmic-signature-web while maintaining (and enhancing) the luxury aesthetic.

**Goal**: Create the world's most beautiful blockchain game interface that also happens to be feature-complete.

**Philosophy**: "Museum meets Bloomberg Terminal" - Every data table is an art piece.

---

## 🏛️ Design Principles for Data-Heavy Features

### 1. **The Gallery Principle**

> "Even spreadsheets can be beautiful"

**Before** (Typical Web3):

```
| ID   | Name      | Owner    | Date     | Action  |
|------|-----------|----------|----------|---------|
| 1234 | NFT #1234 | 0x1234...| 12/01/25 | [Stake] |
| 1235 | NFT #1235 | 0x2345...| 12/02/25 | [Claim] |
```

Cramped, ugly, overwhelming.

**After** (Luxury):

```
┌───────────────────────────────────────────────┐
│                                               │
│   Cosmic Signature #1234                      │ ← Generous spacing
│   ────────────────────                        │   Typography hierarchy
│                                               │   Visual breathing room
│   Owner: alice.eth                            │
│   Minted: December 1, 2025 • Round 234       │
│                                               │
│   Status: ● Staked • Earning 0.08 ETH        │ ← Status with color
│                                               │
│                               [View] [Unstake]│ ← Actions right-aligned
│                                               │
└───────────────────────────────────────────────┘
```

**Key Differences**:

-   Glass morphism card (not table row)
-   Generous padding (24px minimum)
-   Typography hierarchy (3 sizes)
-   Color coding (status dots)
-   Hover elevation
-   Smooth animations
-   Click entire card

---

### 2. **The Progressive Disclosure Principle**

> "Show what matters, hide what doesn't (until needed)"

**Information Layers**:

**Layer 1 - Glance** (Homepage):

-   Current round number
-   Prize pool
-   Countdown
-   Your alerts (if any)

**Layer 2 - Overview** (Dashboard):

-   Your key metrics (4-6 stats)
-   Recent activity (last 10)
-   Action items
-   Quick links

**Layer 3 - Category** (My NFTs):

-   All your NFTs
-   Filter/sort options
-   Summaries
-   Links to individual items

**Layer 4 - Detail** (NFT #1234):

-   Complete information
-   Full history
-   All transactions
-   Everything available

**User chooses depth** - Never forced to see everything at once.

---

### 3. **The Breathing Room Principle**

> "Luxury is space between elements"

**Spacing Rules**:

```css
/* Micro (within components) */
padding: 16px-24px;
gap: 12px-16px;

/* Meso (between components) */
margin-bottom: 24px-32px;
section-gap: 48px-64px;

/* Macro (between sections) */
section-padding: 64px-128px vertical;
container-max-width: 1280px (generous margins);
```

**Applied**:

-   Cards never touch edges
-   Text never fills entire width
-   Images have margins
-   Sections have generous vertical space
-   Mobile: reduce but never cramped

---

### 4. **The Visual Weight Principle**

> "Important things look important"

**Hierarchy**:

**Level 1 - Critical** (Action Items):

-   Size: Large (text-2xl to text-4xl)
-   Color: Primary gold
-   Weight: Font-semibold to font-bold
-   Shadow: shadow-luxury-lg
-   Animation: Pulse or glow

**Level 2 - Important** (Key Metrics):

-   Size: Medium-large (text-xl to text-2xl)
-   Color: Text-primary (white)
-   Weight: Font-medium to font-semibold
-   Shadow: shadow-luxury

**Level 3 - Standard** (Content):

-   Size: Base to large (text-base to text-lg)
-   Color: Text-secondary (gray)
-   Weight: Font-normal to font-medium

**Level 4 - Supporting** (Meta):

-   Size: Small (text-sm to text-xs)
-   Color: Text-muted (darker gray)
-   Weight: Font-normal

**Applied Consistently** across all pages.

---

## 📐 Complete Page Architecture

### Tier 1: Core Pages (Must Have)

1. **Home** (/) - ✅ DONE
2. **Gallery** (/gallery) - ✅ DONE, enhance
3. **Gallery Detail** (/gallery/[id]) - ✅ DONE, enhance
4. **Play** (/game/play) - ✅ DONE, enhance
5. **How It Works** (/game/how-it-works) - ✅ DONE
6. **Prizes** (/game/prizes) - ✅ DONE
7. **Leaderboard** (/game/leaderboard) - ✅ DONE, enhance
8. **Stake** (/stake) - ✅ DONE, enhance
9. **About** (/about) - ✅ DONE

### Tier 2: User Pages (High Priority)

10. **My Account** (/account) - Personal dashboard hub
11. **My NFTs** (/account/nfts) - Collection management
12. **My Winnings** (/account/winnings) - Unclaimed prizes
13. **My Statistics** (/account/stats) - Performance metrics
14. **My Activity** (/account/activity) - Complete timeline

### Tier 3: History Pages (Medium Priority)

15. **Rounds Archive** (/game/history/rounds) - All rounds
16. **Round Detail** (/game/history/rounds/[id]) - Per round
17. **Bids Archive** (/game/history/bids) - All bids
18. **Bid Detail** (/game/history/bids/[id]) - Per bid
19. **Claims Archive** (/game/history/claims) - All claims

### Tier 4: Staking Detail (Medium Priority)

20. **Global Staking** (/stake/global) - All staked NFTs
21. **Staking Actions** (/stake/actions) - Action history
22. **Action Detail** (/stake/actions/[id]) - Per action
23. **Rewards History** (/stake/rewards) - By round
24. **Token Rewards** (/stake/rewards/token/[id]) - Per NFT

### Tier 5: Donations (Medium Priority)

25. **Donations Hub** (/donations) - Overview
26. **ETH Donations** (/donations/eth) - ETH list
27. **ETH Detail** (/donations/eth/[id]) - With advertising
28. **NFT Donations** (/donations/nft) - NFT list
29. **ERC-20 Donations** (/donations/erc20) - Token list
30. **Charity Impact** (/donations/charity) - Charity page

### Tier 6: Community (Lower Priority)

31. **Participants** (/community/participants) - Unique users
32. **User Profile** (/community/user/[address]) - Public profile
33. **Distribution** (/community/distribution) - Token stats
34. **Marketing** (/community/marketing) - Marketing rewards
35. **Named NFTs** (/gallery/named) - Named collection

### Tier 7: Admin (Optional)

36. **Admin Dashboard** (/admin) - Admin only
37. **System Events** (/admin/events) - System log
38. **Moderation** (/admin/moderation) - Ban/unban

---

## 🎨 Luxury Component Specifications

### Component 1: Timeline

**Purpose**: Display chronological events elegantly

**Design Specs**:

```typescript
interface TimelineItem {
	id: string;
	title: string;
	description: string;
	timestamp: number;
	type: 'bid' | 'claim' | 'stake' | 'donation';
	icon?: React.ReactNode;
	metadata?: Record<string, any>;
	link?: string;
}

<Timeline
	items={activities}
	colorScheme="luxury" // gold dots, muted connecting lines
	spacing="generous" // 32px between items
	interactive={true} // Hover effects, click to expand
/>;
```

**Visual**:

-   Vertical line (muted, 1px)
-   Dots (8px, colored by type)
-   Cards (glass morphism)
-   Timestamp (right-aligned, small)
-   Icon (left of dot, colored)
-   Expandable details
-   Smooth reveal animation

**Color Mapping**:

-   Bid: Primary gold
-   Claim: Success green
-   Stake: Info blue
-   Donation: Warning amber
-   Transfer: Platinum

---

### Component 2: Stats Dashboard

**Purpose**: Display key metrics beautifully

**Design Specs**:

```typescript
<StatsGrid cols={3} gap="lg">
	<StatCard
		label="Total Bids"
		value={47}
		icon={TrendingUp}
		trend={{ value: 12, direction: 'up' }}
		sublabel="vs last month"
	/>
	<StatCard label="ETH Spent" value="2.5 ETH" icon={Coins} comparison={{ value: 'Avg: 1.8 ETH', highlight: true }} />
	<StatCard label="Win Rate" value="34%" icon={Trophy} badge="Top 10%" />
</StatsGrid>
```

**Visual**:

-   Glass cards
-   Large numbers (text-3xl, gold)
-   Icons (top-right, muted background circle)
-   Trends (arrows, colored)
-   Comparisons (subtle text below)
-   Hover elevation

---

### Component 3: Luxury Chart

**Purpose**: Data visualization with luxury aesthetic

**Design Specs**:

```typescript
<LuxuryChart
	type="line" // line, bar, pie, donut, area
	data={chartData}
	colorScheme={{
		primary: '#D4AF37', // Gold
		secondary: '#E5E4E2', // Platinum
		accent: '#2D8659', // Emerald
		background: '#0A0A0B', // Deep black
		grid: 'rgba(255,255,255,0.05)' // Subtle grid
	}}
	config={{
		smooth: true, // Smooth curves
		animated: true, // Animate on load
		interactive: true, // Hover tooltips
		responsive: true // Mobile-friendly
	}}
	tooltip={{
		style: 'glass', // Glass morphism
		animation: 'fade' // Smooth
	}}
/>
```

**Visual**:

-   Muted colors (not bright/garish)
-   Smooth curves (not sharp angles)
-   Glass tooltip on hover
-   Animated reveal (stagger effect)
-   Responsive (simplify on mobile)
-   Grid lines (very subtle)
-   Axis labels (luxury typography)

**Chart Library**: Use Recharts with custom theme

---

### Component 4: User Card

**Purpose**: Display user in lists/grids

**Design Specs**:

```typescript
<UserCard
	address="0x1234..."
	ensName="alice.eth"
	stats={{
		bids: 47,
		nfts: 12,
		wins: 3
	}}
	achievements={['main-prize', 'chrono-warrior']}
	onClick={() => router.push(`/user/${address}`)}
/>
```

**Visual**:

```
┌──────────────────────────────────┐
│  [Avatar]  alice.eth             │ ← ENS or shortened address
│            Member since Dec 2024 │   Avatar = identicon or ENS
│                                  │
│  Bids: 47 • NFTs: 12 • Wins: 3  │ ← Key stats inline
│                                  │
│  🏆 ⚡ 🎯                        │ ← Achievement badges
│                                  │
│                    [View Profile]│ ← Action button
└──────────────────────────────────┘
```

**Features**:

-   Identicon generation (from address)
-   ENS name display
-   Quick stats preview
-   Achievement badges (icons)
-   Hover elevation
-   Click to profile

---

### Component 5: Alert Card

**Purpose**: Draw attention to action items

**Design Specs**:

```typescript
<AlertCard
	severity="warning" // info, success, warning, error
	title="You have prizes to claim"
	description="0.5 ETH from Raffle + 2 Donated NFTs"
	action={{
		label: 'Claim Now',
		onClick: handleClaim
	}}
	dismissible={false}
/>
```

**Visual**:

```
┌──────────────────────────────────────────────┐
│  ⚠️  You have prizes to claim                │ ← Icon + title
│                                              │   Gold/colored background
│  0.5 ETH from Raffle                         │   Slightly glowing
│  2 Donated NFTs from Round 230               │
│                                              │
│                      [Claim Now →]           │ ← Prominent CTA
└──────────────────────────────────────────────┘
```

**Colors**:

-   Info: Blue-tinted glass
-   Success: Green-tinted glass
-   Warning: Gold-tinted glass (matches brand)
-   Error: Red-tinted glass

All use alpha transparency + glow effect

---

## 📊 Mock Data Structure

**File Organization**:

```
src/lib/mockData/
├── index.ts                    // Exports all
├── rounds.ts                   // 234 rounds of data
├── bids.ts                     // 10,000+ bids
├── prizes.ts                   // All prize claims
├── users.ts                    // User profiles
├── nfts.ts                     // Enhanced NFT data
├── staking/
│   ├── actions.ts              // Staking actions
│   ├── rewards.ts              // Reward deposits
│   └── stats.ts                // Staking statistics
├── donations/
│   ├── eth.ts                  // ETH donations
│   ├── nft.ts                  // NFT donations
│   ├── erc20.ts                // ERC-20 donations
│   └── charity.ts              // Charity data
├── community/
│   ├── participants.ts         // Unique users
│   ├── distribution.ts         // Token distribution
│   └── marketing.ts            // Marketing rewards
└── admin/
    ├── events.ts               // System events
    └── moderation.ts           // Banned bids
```

**Each file provides**:

-   Type definitions
-   Mock data arrays
-   Query functions (filter, sort, paginate)
-   Matches API response structure

**Example Structure**:

```typescript
// mockData/rounds.ts

export interface RoundData {
	roundNum: number;
	winner: string;
	mainPrizeAmount: string; // Wei
	mainPrizeNFTId: number;
	enduranceChampion: string;
	enduranceChampionPrize: string;
	chronoWarrior: string;
	chronoWarriorPrize: string;
	totalBids: number;
	claimedAt: number;
	duration: number; // seconds
	ethCollected: string;
	cstCollected: string;
}

export const MOCK_ROUNDS: RoundData[] = [
	{
		roundNum: 234,
		winner: '0x1234...',
		mainPrizeAmount: '3100000000000000000', // 3.1 ETH in Wei
		mainPrizeNFTId: 1234,
		enduranceChampion: '0x2345...'
		// ... complete data
	}
	// ... 233 more rounds
];

// Query functions
export function getRounds(offset: number = 0, limit: number = 20): RoundData[] {
	return MOCK_ROUNDS.slice(offset, offset + limit);
}

export function getRoundInfo(roundNum: number): RoundData | null {
	return MOCK_ROUNDS.find(r => r.roundNum === roundNum) || null;
}

export function searchRounds(query: string): RoundData[] {
	// Search logic
}
```

---

## 🎭 Page Templates

### Template A: Dashboard Page

**Used for**: My Account, My Statistics, Admin Dashboard

**Structure**:

```tsx
<div className="min-h-screen">
	{/* Hero - Title + Key Metric */}
	<section className="section-padding bg-background-surface/50">
		<Container>
			<h1 className="heading-lg mb-4">{title}</h1>
			<p className="body-lg">{subtitle}</p>
			{heroMetric && (
				<div className="mt-8">
					<HeroMetric value={value} label={label} />
				</div>
			)}
		</Container>
	</section>

	{/* Alert Cards (if any) */}
	{alerts.length > 0 && (
		<section className="py-12">
			<Container>
				{alerts.map(alert => (
					<AlertCard key={alert.id} {...alert} />
				))}
			</Container>
		</section>
	)}

	{/* Stats Grid */}
	<section className="py-12">
		<Container>
			<StatsGrid>
				{stats.map(stat => (
					<StatCard key={stat.label} {...stat} />
				))}
			</StatsGrid>
		</Container>
	</section>

	{/* Main Content (Tabs or Sections) */}
	<section className="py-12 bg-background-surface/50">
		<Container>{/* Content varies by page */}</Container>
	</section>
</div>
```

---

### Template B: List Page

**Used for**: Bids, Claims, Rounds, Donations, Staking Actions

**Structure**:

```tsx
<div className="min-h-screen">
	{/* Hero */}
	<section className="section-padding bg-background-surface/50">
		<Container>
			<h1 className="heading-lg mb-4">{title}</h1>
			<p className="body-lg">{description}</p>
			{/* Summary stats if applicable */}
		</Container>
	</section>

	{/* Filter Bar (Sticky) */}
	<section className="sticky top-[88px] z-40 py-6 bg-background/95 backdrop-blur-xl border-b border-text-muted/10">
		<Container>
			<FilterBar
				onSearch={setQuery}
				filters={filterConfig}
				onFilterChange={handleFilter}
				sortOptions={sortOptions}
				onSortChange={handleSort}
				viewMode={viewMode}
				onViewModeChange={setViewMode}
			/>
		</Container>
	</section>

	{/* List Content */}
	<section className="py-12">
		<Container>
			{loading ? (
				<SkeletonGrid count={12} />
			) : (
				<ElegantTable data={filteredData} columns={columns} mode={viewMode} onRowClick={handleRowClick} />
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="mt-12">
					<Pagination current={page} total={totalPages} onChange={setPage} />
				</div>
			)}
		</Container>
	</section>
</div>
```

---

### Template C: Detail Page

**Used for**: NFT Detail, Round Detail, Bid Detail, User Profile

**Structure**:

```tsx
<div className="min-h-screen section-padding">
	<Container>
		{/* Breadcrumbs */}
		<Breadcrumbs items={breadcrumbs} className="mb-8" />

		{/* Main Content Grid */}
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
			{/* Left: Visual/Primary */}
			<div>
				{/* Image, Chart, or Primary Visual */}
				<Card glass className="overflow-hidden">
					{mainVisual}
				</Card>

				{/* Secondary visuals */}
			</div>

			{/* Right: Metadata */}
			<div className="space-y-6">
				{/* Title */}
				<div>
					<h1 className="heading-sm mb-2">{title}</h1>
					<p className="text-text-secondary">{subtitle}</p>
				</div>

				{/* Key Info Card */}
				<Card glass>
					<CardContent className="p-6 space-y-4">{/* Key-value pairs */}</CardContent>
				</Card>

				{/* Actions */}
				{actions && (
					<div className="flex gap-3">
						{actions.map(action => (
							<Button key={action.label} {...action.props}>
								{action.label}
							</Button>
						))}
					</div>
				)}

				{/* Additional Info Cards */}
				{additionalSections.map(section => (
					<Card glass key={section.title}>
						<CardContent className="p-6">
							<h3 className="font-serif text-xl font-semibold text-text-primary mb-4">{section.title}</h3>
							{section.content}
						</CardContent>
					</Card>
				))}
			</div>
		</div>

		{/* Tabs for Additional Data */}
		{tabs.length > 0 && (
			<div className="mt-12">
				<TabNavigation tabs={tabs} />
				{/* Tab content */}
			</div>
		)}
	</Container>
</div>
```

---

## 🎯 Implementation Priority Matrix

### Week 1-2: Foundation

**Priority**: Critical
**Goal**: Users can see their personal data

| Feature              | Complexity | Impact   | Build  |
| -------------------- | ---------- | -------- | ------ |
| My Account Dashboard | High       | Critical | ✅ Yes |
| My NFTs              | Medium     | Critical | ✅ Yes |
| My Winnings          | Medium     | Critical | ✅ Yes |
| My Statistics        | High       | High     | ✅ Yes |
| My Activity          | Medium     | Medium   | ✅ Yes |

**Components Needed**:

-   Timeline
-   Stats Grid (enhance existing)
-   Alert Card
-   User Avatar
-   Address Display
-   Transaction Link

**Mock Data Needed**:

-   User profiles
-   User NFTs with staking status
-   User prizes (claimed/unclaimed)
-   User activity log

---

### Week 3: History

**Priority**: High
**Goal**: Users can explore game history

| Feature        | Complexity | Impact | Build    |
| -------------- | ---------- | ------ | -------- |
| Round Archive  | Medium     | High   | ✅ Yes   |
| Round Detail   | High       | High   | ✅ Yes   |
| Bids Archive   | Medium     | Medium | ✅ Yes   |
| Bid Detail     | Low        | Low    | ⚠️ Maybe |
| Claims Archive | Low        | Medium | ⚠️ Maybe |

---

### Week 4: Donations

**Priority**: Medium
**Goal**: Showcase donation ecosystem

| Feature          | Complexity | Impact | Build                    |
| ---------------- | ---------- | ------ | ------------------------ |
| Donations Hub    | Low        | Medium | ✅ Yes                   |
| ETH Donations    | Medium     | Medium | ✅ Yes                   |
| ETH Detail (Ads) | High       | High   | ✅ Yes (Unique feature!) |
| NFT Donations    | Low        | Low    | ⚠️ Maybe                 |
| Charity Impact   | Low        | Medium | ✅ Yes                   |

---

### Week 5: Staking

**Priority**: Medium
**Goal**: Complete staking features

| Feature         | Complexity | Impact | Build    |
| --------------- | ---------- | ------ | -------- |
| Global Staking  | Low        | Low    | ⚠️ Maybe |
| Staking Actions | Medium     | Low    | ⚠️ Maybe |
| Action Detail   | Low        | Low    | ❌ Skip  |
| Rewards History | Medium     | Medium | ⚠️ Maybe |
| Token Rewards   | High       | Low    | ❌ Skip  |

---

### Week 6: Community

**Priority**: Low
**Goal**: Community discovery

| Feature               | Complexity | Impact | Build    |
| --------------------- | ---------- | ------ | -------- |
| Participants          | Low        | Medium | ✅ Yes   |
| User Profile (Public) | Medium     | Medium | ✅ Yes   |
| Distribution          | Low        | Low    | ⚠️ Maybe |
| Marketing             | Low        | Low    | ❌ Skip  |
| Named NFTs            | Low        | Medium | ✅ Yes   |

---

### Week 7: Polish

-   Bug fixes
-   Performance optimization
-   Mobile testing
-   Content review
-   Animation refinement
-   Empty states
-   Error states
-   Loading states

---

## 🎨 Design Specifications for Each Page Type

### Specification: "My Winnings" Page

**Layout Requirements**:

1. Hero section with total unclaimed value (LARGE)
2. Alert cards for each prize type (PROMINENT)
3. Expandable "Claimed History" (COLLAPSIBLE)
4. Empty state if no winnings (ENCOURAGING)

**Visual Hierarchy**:

-   Unclaimed amounts: text-4xl, gold, font-bold
-   Prize cards: Glass with colored accents
-   Claim buttons: Large, gold, pulsing
-   History: Muted, collapsible, timeline format

**Interactions**:

-   Hover prize card: Elevate, show details
-   Click claim: Loading state → Success animation → Confetti
-   Expand history: Smooth accordion
-   Empty state: "Start playing" CTA

**Micro-interactions**:

-   Number count-up animation on load
-   Pulse on unclaimed amounts
-   Checkmark animation on claimed items
-   Confetti on successful claim
-   Toast notification on completion

---

### Specification: "Round Archive" Page

**Layout Requirements**:

1. Hero with total rounds completed
2. Search bar (round number, winner address)
3. View toggle (Timeline vs Grid)
4. Pagination (smooth, not jarring)

**Timeline View**:

```
Dec 2025
  Round 234  •  alice.eth won 3.1 ETH  •  47 bids
  Round 233  •  bob.eth won 2.8 ETH    •  52 bids

Nov 2025
  Round 232  •  carol.eth won 3.5 ETH  •  41 bids
  ...
```

**Grid View**:

```
┌───────────┐ ┌───────────┐ ┌───────────┐
│ Round 234 │ │ Round 233 │ │ Round 232 │
│ 3.1 ETH   │ │ 2.8 ETH   │ │ 3.5 ETH   │
│ 47 bids   │ │ 52 bids   │ │ 41 bids   │
│ [Details] │ │ [Details] │ │ [Details] │
└───────────┘ └───────────┘ └───────────┘
```

**Visual**:

-   Month dividers in timeline
-   Cards with prize amount prominent
-   Click → Round Detail page
-   Smooth scroll loading
-   Skeleton loaders

---

### Specification: "ETH Donation with Info" Detail Page

**This is Special** - Advertising/promotional content

**Layout Requirements**:

1. Split layout (50/50)
2. Left: Donation metadata
3. Right: Advertising content (hero treatment)

**Visual Approach**:

```
┌────────────────────────────────────────────────────┐
│  [Back to Donations]                               │
├──────────────────────────┬─────────────────────────┤
│                          │                         │
│  Donation Details        │  Promotional Message    │
│                          │                         │
│  Amount: 0.5 ETH         │  [Hero Image]           │ ← Large
│  Donor: alice.eth        │  ─────────              │   Prominent
│  Round: 234              │                         │   Featured
│  Date: Dec 7, 2025       │  "Check out our new     │
│                          │   NFT collection!"      │
│  [View Transaction]      │                         │
│                          │  Learn more at:         │
│                          │  example.com            │
│                          │                         │
│                          │  [Visit Site →]         │
│                          │                         │
└──────────────────────────┴─────────────────────────┘
```

**Data Handling**:

```typescript
// Parse JSON from Data field
interface DonationAdData {
	message?: string;
	title?: string;
	url?: string;
	image?: string;
	cta?: string;
}

const parsedData: DonationAdData = JSON.parse(donation.Data);

// Display beautifully
<Card glass className="p-8">
	{parsedData.image && <img src={parsedData.image} className="w-full rounded-lg mb-6" alt="Promotional content" />}

	{parsedData.title && <h2 className="heading-sm mb-4">{parsedData.title}</h2>}

	{parsedData.message && <p className="text-text-secondary leading-relaxed mb-6">{parsedData.message}</p>}

	{parsedData.url && (
		<Button size="lg" asChild>
			<a href={parsedData.url} target="_blank">
				{parsedData.cta || 'Learn More'}
			</a>
		</Button>
	)}
</Card>;
```

**Key**: Treat as premium content, not spam. Make it beautiful.

---

## 🗺️ Navigation Enhancement

### Enhanced Header

```typescript
// src/components/layout/Header.tsx - ENHANCED

<header>
	<Container>
		<nav>
			{/* Logo */}

			{/* Desktop Nav */}
			<div className="hidden lg:flex items-center space-x-1">
				<Link href="/">Home</Link>
				<Link href="/gallery">Gallery</Link>

				{/* Game Dropdown - ENHANCED */}
				<DropdownMenu>
					<DropdownTrigger>Game</DropdownTrigger>
					<DropdownContent>
						<DropdownSection label="Play">
							<DropdownItem href="/game/play">Play Now</DropdownItem>
							<DropdownItem href="/game/how-it-works">How It Works</DropdownItem>
							<DropdownItem href="/game/prizes">Prizes</DropdownItem>
						</DropdownSection>
						<DropdownSection label="Explore">
							<DropdownItem href="/game/leaderboard">Leaderboard</DropdownItem>
							<DropdownItem href="/game/history/rounds">Round History</DropdownItem>
							<DropdownItem href="/game/history/bids">Bid History</DropdownItem>
						</DropdownSection>
					</DropdownContent>
				</DropdownMenu>

				{/* My Account Dropdown - NEW */}
				<DropdownMenu>
					<DropdownTrigger>My Account</DropdownTrigger>
					<DropdownContent>
						<DropdownItem href="/account">Dashboard</DropdownItem>
						<DropdownItem href="/account/nfts">
							My NFTs
							{userNFTCount > 0 && <Badge>{userNFTCount}</Badge>}
						</DropdownItem>
						<DropdownItem href="/account/winnings">
							My Winnings
							{unclaimedCount > 0 && <Badge variant="warning">{unclaimedCount}</Badge>}
						</DropdownItem>
						<DropdownItem href="/account/stats">Statistics</DropdownItem>
						<DropdownItem href="/account/activity">Activity</DropdownItem>
					</DropdownContent>
				</DropdownMenu>

				{/* Stake */}
				<Link href="/stake">Stake</Link>

				{/* Donations Dropdown - NEW */}
				<DropdownMenu>
					<DropdownTrigger>Donations</DropdownTrigger>
					<DropdownContent>
						<DropdownItem href="/donations">Overview</DropdownItem>
						<DropdownItem href="/donations/eth">ETH Donations</DropdownItem>
						<DropdownItem href="/donations/nft">NFT Donations</DropdownItem>
						<DropdownItem href="/donations/charity">Charity Impact</DropdownItem>
					</DropdownContent>
				</DropdownMenu>

				{/* Community Dropdown - NEW */}
				<DropdownMenu>
					<DropdownTrigger>Community</DropdownTrigger>
					<DropdownContent>
						<DropdownItem href="/community/participants">Participants</DropdownItem>
						<DropdownItem href="/community/distribution">Distribution</DropdownItem>
						<DropdownItem href="/gallery/named">Named NFTs</DropdownItem>
					</DropdownContent>
				</DropdownMenu>

				<Link href="/about">About</Link>
			</div>

			{/* Wallet Button */}
			<Button>Connect Wallet</Button>
		</nav>
	</Container>
</header>
```

**Design Notes**:

-   Dropdowns use glass morphism
-   Hover states are subtle but clear
-   Badges show counts (not overwhelming)
-   Organized by user intent
-   No clutter

---

## 💎 Luxury Guidelines for Every New Page

### Checklist for Each Page:

**Layout**:

-   [ ] Hero section with clear title
-   [ ] Generous vertical spacing (64px+ between sections)
-   [ ] Proper container max-width (1280px)
-   [ ] Responsive breakpoints work perfectly
-   [ ] No horizontal scroll on mobile

**Typography**:

-   [ ] Headings use Cormorant Garamond
-   [ ] Body text uses Inter
-   [ ] Numbers/data use Space Grotesk
-   [ ] Hierarchy is clear (3-4 distinct levels)
-   [ ] Line height is generous (1.6-1.8)

**Color**:

-   [ ] Gold used sparingly for accents
-   [ ] Primary data in white
-   [ ] Secondary data in gray
-   [ ] Status colors used appropriately
-   [ ] No harsh contrasts

**Components**:

-   [ ] All cards use glass morphism
-   [ ] Borders are subtle (rgba(107, 107, 102, 0.1))
-   [ ] Hover states elevate and glow
-   [ ] Click areas are large (44px min)
-   [ ] Loading states use skeletons (not spinners)

**Animation**:

-   [ ] Fade in on scroll (viewport-aware)
-   [ ] Stagger animations for lists (delay: index \* 0.05)
-   [ ] Smooth transitions (duration: 300ms)
-   [ ] Hover effects are subtle
-   [ ] Success states celebrate (confetti, checkmark)

**Content**:

-   [ ] Labels are clear and concise
-   [ ] Help text where needed
-   [ ] Empty states are encouraging
-   [ ] Error states are helpful
-   [ ] Success states are celebratory

**Interactions**:

-   [ ] Click entire card (not just button)
-   [ ] Keyboard navigable
-   [ ] Focus indicators visible
-   [ ] Touch targets are large (mobile)
-   [ ] Feedback on all actions

---

## 📖 Code Organization

### Directory Structure:

```
src/
├── app/
│   ├── account/                    # NEW SECTION
│   │   ├── page.tsx               # Dashboard
│   │   ├── nfts/page.tsx          # My NFTs
│   │   ├── winnings/page.tsx      # My Winnings
│   │   ├── stats/page.tsx         # Statistics
│   │   └── activity/page.tsx      # Activity Log
│   ├── game/
│   │   ├── play/page.tsx          # ✅ Existing
│   │   ├── how-it-works/page.tsx  # ✅ Existing
│   │   ├── prizes/page.tsx        # ✅ Existing
│   │   ├── leaderboard/page.tsx   # ✅ Existing
│   │   └── history/               # NEW SUBSECTION
│   │       ├── rounds/
│   │       │   ├── page.tsx       # Archive
│   │       │   └── [id]/page.tsx  # Detail
│   │       ├── bids/
│   │       │   ├── page.tsx       # Archive
│   │       │   └── [id]/page.tsx  # Detail
│   │       └── claims/page.tsx    # Archive
│   ├── gallery/
│   │   ├── page.tsx               # ✅ Existing, enhance
│   │   ├── [id]/page.tsx          # ✅ Existing, enhance
│   │   └── named/page.tsx         # NEW - Named NFTs
│   ├── stake/
│   │   ├── page.tsx               # ✅ Existing, enhance
│   │   ├── global/page.tsx        # NEW - Global stats
│   │   ├── actions/
│   │   │   ├── page.tsx           # Action list
│   │   │   └── [id]/page.tsx      # Action detail
│   │   └── rewards/
│   │       ├── page.tsx           # Rewards history
│   │       └── token/[id]/page.tsx # Per-token rewards
│   ├── donations/                  # NEW SECTION
│   │   ├── page.tsx               # Hub
│   │   ├── eth/
│   │   │   ├── page.tsx           # ETH list
│   │   │   └── [id]/page.tsx      # ETH detail (ads!)
│   │   ├── nft/page.tsx           # NFT list
│   │   ├── erc20/page.tsx         # ERC-20 list
│   │   └── charity/page.tsx       # Charity impact
│   ├── community/                  # NEW SECTION
│   │   ├── participants/page.tsx  # Unique users
│   │   ├── user/[address]/page.tsx # Public profile
│   │   ├── distribution/page.tsx  # Token stats
│   │   └── marketing/page.tsx     # Marketing rewards
│   ├── admin/                      # NEW SECTION (Hidden)
│   │   ├── page.tsx               # Dashboard
│   │   ├── events/page.tsx        # System events
│   │   └── moderation/page.tsx    # Ban/unban
│   └── about/page.tsx             # ✅ Existing
├── components/
│   ├── ui/                         # ✅ Existing
│   ├── layout/                     # ✅ Existing, enhance
│   ├── game/                       # ✅ Existing
│   ├── nft/                        # ✅ Existing
│   ├── data/                       # NEW - Data components
│   │   ├── ElegantTable.tsx
│   │   ├── Timeline.tsx
│   │   ├── LuxuryChart.tsx
│   │   ├── FilterBar.tsx
│   │   ├── StatsGrid.tsx
│   │   └── EmptyState.tsx
│   └── features/                   # NEW - Feature components
│       ├── AlertCard.tsx
│       ├── UserCard.tsx
│       ├── UserAvatar.tsx
│       ├── RoundCard.tsx
│       ├── BidCard.tsx
│       ├── PrizeCard.tsx
│       ├── AddressDisplay.tsx
│       ├── TransactionLink.tsx
│       ├── StatusBadge.tsx
│       ├── AchievementBadge.tsx
│       ├── Breadcrumbs.tsx
│       └── TabNavigation.tsx
├── lib/
│   ├── mockData/                   # NEW - Complete mock data
│   │   ├── index.ts
│   │   ├── rounds.ts
│   │   ├── bids.ts
│   │   ├── prizes.ts
│   │   ├── users.ts
│   │   ├── nfts.ts
│   │   ├── staking/
│   │   ├── donations/
│   │   ├── community/
│   │   └── admin/
│   ├── utils.ts                    # ✅ Existing, enhance
│   └── constants.ts                # ✅ Existing, enhance
└── types/                          # ✅ Existing, enhance
    └── index.ts
```

---

## 🎯 Key Implementation Decisions

### Decision 1: Card-First, Table-Optional

**Default**: All lists show as cards
**Option**: Toggle to table view for power users

**Why**:

-   Cards are more visual
-   Cards allow more design flexibility
-   Cards work better on mobile
-   Cards maintain luxury feel
-   Tables available when needed

---

### Decision 2: Timeline Over Table (When Appropriate)

**Use Timeline For**:

-   Activity logs
-   Prize claims
-   Staking actions
-   Donations
-   Events

**Use Table For**:

-   NFT lists (better as grid)
-   Comparative data
-   When user explicitly wants table

---

### Decision 3: Summary → Detail (Always)

**Every complex page follows pattern**:

1. Hero with key metrics
2. Summary visualization
3. Recent/important items
4. Link to full list
5. Full list is separate or tabbed

**Example Flow**:

```
My Account Dashboard
  → Shows "You have 12 NFTs"
  → Shows preview grid (6 NFTs)
  → Button: "View All 12 NFTs →"
  → Clicks → /account/nfts (full list)
```

---

### Decision 4: Mock Data Mirrors API Structure

**Benefit**: When connecting API, just swap imports

```typescript
// Before (Mock)
import { getRounds } from '@/lib/mockData/rounds';
const rounds = getRounds(0, 20);

// After (API)
import { api } from '@/lib/api';
const rounds = await api.getRounds(0, 20);

// Components don't change!
```

---

## 🎨 Style Guide for New Pages

### Color Usage Rules

**Gold (#D4AF37)**:

-   Primary CTAs
-   Key metrics
-   Active states
-   Accents (sparingly)
-   Hover glows

**White (#F5F5F0)**:

-   Primary text
-   Headings
-   Important data
-   User-generated content

**Gray (#A8A8A0)**:

-   Secondary text
-   Labels
-   Descriptions
-   Body copy

**Muted Gray (#6B6B66)**:

-   Tertiary text
-   Timestamps
-   Meta information
-   Disabled states

**Status Colors**:

-   Success (#2D8659): Claimed, completed, positive
-   Warning (#D97706): Pending, attention needed
-   Error (#991B1B): Failed, negative
-   Info (#475569): Neutral, informational

**Backgrounds**:

-   Page: #0A0A0B (deep black)
-   Surface: #151518 (elevated)
-   Cards: rgba(21, 21, 24, 0.6) with blur (glass)

---

### Typography Rules

**Headings** (Cormorant Garamond):

```css
.heading-xl: 48-72px, font-semibold
.heading-lg: 36-60px, font-semibold
.heading-md: 30-48px, font-semibold
.heading-sm: 24-36px, font-semibold
```

**Body** (Inter):

```css
.body-xl: 18-20px, text-text-secondary
.body-lg: 16-18px, text-text-secondary
body: 16px, text-text-secondary
small: 14px, text-text-muted
tiny: 12px, text-text-muted
```

**Data/Numbers** (Space Grotesk):

```css
.number-hero: 48-64px, font-bold, text-primary
.number-large: 32-40px, font-semibold, text-primary
.number-medium: 20-24px, font-medium, text-primary
.number-small: 16px, font-normal, text-text-primary
```

---

### Animation Patterns

**Page Load**:

```typescript
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8 }}
```

**Scroll Reveal**:

```typescript
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ delay: 0.2 }}
```

**List Stagger**:

```typescript
items.map((item, index) => (
	<motion.div
		initial={{ opacity: 0, x: -20 }}
		animate={{ opacity: 1, x: 0 }}
		transition={{ delay: index * 0.05, duration: 0.4 }}
	>
		{/* Content */}
	</motion.div>
));
```

**Hover**:

```css
hover:scale-[1.02]
hover:shadow-luxury
transition-all duration-300
```

**Success**:

```typescript
// On successful action
<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
	<CheckCircle className="text-status-success" size={48} />
</motion.div>

// + Confetti effect
```

---

## 📋 Complete Implementation Checklist

### Foundation Components (Build First)

**Data Display**:

-   [x] ElegantTable - Completed
-   [ ] Timeline - Build next
-   [ ] LuxuryChart - Build next
-   [ ] FilterBar - Build next
-   [ ] EmptyState - Build next

**Feature Components**:

-   [ ] AlertCard
-   [ ] UserCard
-   [ ] User Avatar
-   [ ] RoundCard
-   [ ] BidCard
-   [ ] PrizeCard
-   [ ] AddressDisplay
-   [ ] TransactionLink
-   [ ] StatusBadge
-   [ ] AchievementBadge
-   [ ] Breadcrumbs
-   [ ] TabNavigation
-   [ ] DropdownMenu (enhance existing)

**Layout Enhancements**:

-   [ ] Header with new dropdowns
-   [ ] Footer (keep existing)
-   [ ] Breadcrumb system
-   [ ] Sticky filter bars

### Mock Data (Build Systematically)

-   [ ] Rounds (234 rounds)
-   [ ] Bids (10,000+ bids)
-   [ ] Prizes (all claims)
-   [ ] Users (1,000+ profiles)
-   [ ] NFTs (enhance existing)
-   [ ] Staking actions
-   [ ] Staking rewards
-   [ ] ETH donations
-   [ ] NFT donations
-   [ ] ERC-20 donations
-   [ ] Charity data
-   [ ] Marketing rewards
-   [ ] System events
-   [ ] Distribution data

### Pages - Tier 1 (User Account)

-   [ ] /account - Dashboard
-   [ ] /account/nfts - My NFTs
-   [ ] /account/winnings - My Winnings
-   [ ] /account/stats - Statistics
-   [ ] /account/activity - Activity Log

### Pages - Tier 2 (History)

-   [ ] /game/history/rounds - Round archive
-   [ ] /game/history/rounds/[id] - Round detail
-   [ ] /game/history/bids - Bid archive
-   [ ] /game/history/bids/[id] - Bid detail
-   [ ] /game/history/claims - Claim archive

### Pages - Tier 3 (Donations)

-   [ ] /donations - Hub
-   [ ] /donations/eth - ETH list
-   [ ] /donations/eth/[id] - ETH detail (advertising!)
-   [ ] /donations/nft - NFT list
-   [ ] /donations/erc20 - ERC-20 list
-   [ ] /donations/charity - Charity impact

### Pages - Tier 4 (Staking Detail)

-   [ ] /stake/global - Global stats
-   [ ] /stake/actions - Action list
-   [ ] /stake/actions/[id] - Action detail
-   [ ] /stake/rewards - Rewards history
-   [ ] /stake/rewards/token/[id] - Per-token rewards

### Pages - Tier 5 (Community)

-   [ ] /community/participants - Unique users
-   [ ] /community/user/[address] - Public profile
-   [ ] /community/distribution - Token distribution
-   [ ] /community/marketing - Marketing rewards
-   [ ] /gallery/named - Named NFTs

### Pages - Tier 6 (Admin)

-   [ ] /admin - Dashboard
-   [ ] /admin/events - System events
-   [ ] /admin/moderation - Moderation tools

### Enhancements to Existing Pages

-   [ ] Gallery - Add filters, sorts, named view
-   [ ] Gallery Detail - Add transfer/name history
-   [ ] Leaderboard - Add more categories
-   [ ] Stake - Add global stats, history tabs
-   [ ] About - Add contracts detail, source viewer

---

## 🚀 Recommended Implementation Order

Given the scope, I recommend implementing in phases:

**Phase 1** (This conversation - Foundation):

1. Core components (Timeline, Chart, etc.)
2. Mock data structure
3. My Account section (5 pages)
4. This provides immediate value

**Phase 2** (Next session - History): 5. Game history section 6. Enhanced gallery 7. Round details

**Phase 3** (Future - Complete): 8. Donations 9. Community 10. Admin 11. Polish

---

## 💡 Critical Success Factors

### 1. **Consistency**

Every page follows same patterns:

-   Hero section structure
-   Card styling
-   Animation timing
-   Color usage
-   Typography hierarchy
-   Spacing system

**Create page templates** to enforce consistency.

---

### 2. **Performance**

With more pages and data:

-   Code splitting (automatic with App Router)
-   Lazy load heavy components
-   Virtual scrolling for long lists
-   Image optimization
-   Debounced search
-   Memoization for expensive calculations

---

### 3. **Accessibility**

Every new component:

-   Keyboard navigable
-   Screen reader friendly
-   ARIA labels
-   Focus indicators
-   Color contrast (WCAG AA)
-   Touch-friendly (mobile)

---

### 4. **Mobile Experience**

Every page:

-   Works perfectly on mobile
-   No horizontal scroll
-   Large touch targets
-   Simplified when needed
-   Fast loading
-   Gesture-friendly

---

## 🎬 Let's Start Implementation

I'll now begin implementing the foundation systematically:

1. **Core components** (Timeline, Chart, Alert, etc.)
2. **Mock data structure** (comprehensive)
3. **My Account section** (5 pages)
4. **Enhanced navigation**

This will provide the foundation for all other features while maintaining the luxury aesthetic throughout.

**Ready to build the most beautiful blockchain game interface ever created.** 🎨✨

---

_This blueprint provides complete specifications for implementing all 50+ features. Actual implementation will be done systematically, maintaining luxury at every step._
