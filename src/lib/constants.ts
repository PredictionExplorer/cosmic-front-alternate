// Game Constants (Mock data for now - will be replaced with blockchain data later)

export const GAME_CONSTANTS = {
  MAIN_PRIZE_PERCENTAGE: 25,
  CHRONO_WARRIOR_PERCENTAGE: 8,
  RAFFLE_PERCENTAGE: 4,
  STAKING_PERCENTAGE: 6,
  CHARITY_PERCENTAGE: 7,
  NEXT_ROUND_PERCENTAGE: 50,

  NUM_RAFFLE_ETH_WINNERS: 3,
  NUM_RAFFLE_NFT_WINNERS: 5,
  NUM_RANDOM_WALK_NFT_WINNERS: 4,

  CST_REWARD_PER_BID: 100,
  CST_PRIZE_MULTIPLIER: 10,
  MARKETING_CST_AMOUNT: 1000,

  FIRST_ROUND_ETH_BID_PRICE: 0.0001,
  RANDOM_WALK_DISCOUNT: 50, // 50% discount

  INITIAL_TIMER_EXTENSION: 3600, // 1 hour in seconds
} as const;

export const MOCK_CURRENT_ROUND = {
  roundNumber: 234,
  prizePool: 12.5,
  lastBidder: "0x1234...5678",
  totalBids: 47,
  ethBidPrice: 0.0023,
  cstBidPrice: 45.2,
  timeRemaining: 9252, // seconds
  isActive: true,
  enduranceChampion: {
    address: "alice.eth",
    duration: 2700, // 45 minutes in seconds
  },
  chronoWarrior: {
    address: "bob.eth",
    duration: 1380, // 23 minutes in seconds
  },
};

// Generate deterministic mock data (no Math.random to avoid hydration issues)
function generateDeterministicAddress(seed: number): string {
  const hash = (seed * 9301 + 49297) % 233280;
  return `0x${hash.toString(16).padStart(8, "0")}...`;
}

function generateDeterministicSeed(seed: number): string {
  const hash = (seed * 12345 + 67890) % 999999;
  return `0x${hash.toString(16).padStart(16, "0")}...`;
}

export const MOCK_NFTS = Array.from({ length: 24 }, (_, i) => {
  const seed = 1000 + i;
  const daysAgo = (i * 7) % 365; // Spread over a year
  const mintDate = new Date("2024-01-01");
  mintDate.setDate(mintDate.getDate() + daysAgo);

  return {
    id: i + 1,
    tokenId: seed,
    name: `Cosmic Signature #${seed}`,
    customName: i % 5 === 0 ? `Cosmic Dawn ${i + 1}` : undefined, // Some NFTs have custom names
    owner: generateDeterministicAddress(seed),
    round: ((seed - 1000) % 200) + 1,
    seed: generateDeterministicSeed(seed),
    imageUrl: `/nfts/${i + 1}.jpg`,
    videoUrl: `/nfts/${i + 1}.mp4`,
    mintedAt: mintDate.toISOString(),
  };
});

export const PRIZE_TYPES = [
  {
    name: "Main Prize",
    percentage: GAME_CONSTANTS.MAIN_PRIZE_PERCENTAGE,
    description: "Last bidder when timer expires",
    rewards: ["25% of ETH pool", "1 Cosmic Signature NFT"],
    color: "primary",
  },
  {
    name: "Endurance Champion",
    percentage: 0,
    description: "Longest single duration as last bidder",
    rewards: [
      `${GAME_CONSTANTS.CST_PRIZE_MULTIPLIER}x CST per bid`,
      "1 Cosmic Signature NFT",
    ],
    color: "accent",
  },
  {
    name: "Chrono-Warrior",
    percentage: GAME_CONSTANTS.CHRONO_WARRIOR_PERCENTAGE,
    description: "Longest duration as Endurance Champion",
    rewards: ["8% of ETH pool"],
    color: "info",
  },
  {
    name: "Raffle Winners",
    percentage: GAME_CONSTANTS.RAFFLE_PERCENTAGE,
    description: "Random selection among all bidders",
    rewards: [
      "4% of ETH split among 3 winners",
      "5 Cosmic Signature NFTs to bidders",
      "4 Cosmic Signature NFTs to stakers",
    ],
    color: "warning",
  },
  {
    name: "NFT Stakers",
    percentage: GAME_CONSTANTS.STAKING_PERCENTAGE,
    description: "Distributed to all staked NFTs",
    rewards: ["6% of ETH pool (proportional)"],
    color: "success",
  },
  {
    name: "Charity",
    percentage: GAME_CONSTANTS.CHARITY_PERCENTAGE,
    description: "Supporting charitable causes",
    rewards: ["7% of ETH pool"],
    color: "error",
  },
] as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  {
    label: "Game",
    submenu: [
      { href: "/game/play", label: "Play Now" },
      { href: "/game/how-it-works", label: "How It Works" },
      { href: "/game/prizes", label: "Prize Structure" },
      { href: "/game/leaderboard", label: "Leaderboard" },
      { href: "/game/history/rounds", label: "Round History" },
    ],
  },
  {
    label: "My Account",
    submenu: [
      { href: "/account", label: "Dashboard" },
      { href: "/account/nfts", label: "My NFTs" },
      { href: "/account/winnings", label: "My Winnings" },
      { href: "/account/activity", label: "Activity" },
    ],
  },
  { href: "/stake", label: "Stake" },
  { href: "/about", label: "About" },
] as const;
