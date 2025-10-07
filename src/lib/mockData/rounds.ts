// Mock round data - mirrors API structure from /rounds/info/:prize_num

export interface RoundData {
  roundNum: number;
  winner: string;
  winnerENS?: string;
  mainPrizeAmount: string; // Wei
  mainPrizeNFTId: number;
  enduranceChampion: string;
  enduranceChampionENS?: string;
  enduranceChampionPrize: string; // CST in Wei
  chronoWarrior: string;
  chronoWarriorENS?: string;
  chronoWarriorPrize: string; // ETH in Wei
  raffleTotalETH: string;
  numRaffleETHWinners: number;
  numRaffleNFTWinners: number;
  stakingTotalETH: string;
  charityDonation: string;
  claimedAt: number; // Unix timestamp
  totalBids: number;
  totalDonations: number;
  duration: number; // seconds
  ethCollected: string;
  cstCollected: string;
}

// Deterministic random-like function (no Math.random for SSR compatibility)
function deterministicValue(seed: number, min: number, max: number): number {
  const hash = (seed * 9301 + 49297) % 233280;
  return min + (hash / 233280) * (max - min);
}

// Generate mock rounds (most recent first)
export const MOCK_ROUNDS: RoundData[] = Array.from({ length: 234 }, (_, i) => {
  const roundNum = 234 - i;
  const baseTimestamp = 1704067200; // Jan 1, 2024
  const timestamp = baseTimestamp + (234 - i) * 3 * 24 * 60 * 60;

  const mainPrize = deterministicValue(roundNum, 2.5, 4.5).toFixed(4);
  const chronoPrize = deterministicValue(roundNum + 1000, 0.5, 1.0).toFixed(4);
  const rafflePrize = deterministicValue(roundNum + 2000, 0.3, 0.6).toFixed(4);
  const stakingPrize = deterministicValue(roundNum + 3000, 0.6, 1.0).toFixed(4);
  const charityAmount = deterministicValue(roundNum + 4000, 0.7, 1.0).toFixed(
    4
  );

  const bids = Math.floor(deterministicValue(roundNum + 5000, 35, 65));

  // Generate deterministic addresses
  const winnerHash = ((roundNum * 7919 + 6571) % 999999)
    .toString(16)
    .padStart(8, "0");
  const enduranceHash = ((roundNum * 8831 + 7753) % 999999)
    .toString(16)
    .padStart(8, "0");
  const chronoHash = ((roundNum * 9743 + 8837) % 999999)
    .toString(16)
    .padStart(8, "0");

  return {
    roundNum,
    winner: `0x${winnerHash}...`,
    winnerENS:
      roundNum === 234 ? "alice.eth" : roundNum === 233 ? "bob.eth" : undefined,
    mainPrizeAmount: (parseFloat(mainPrize) * 1e18).toString(),
    mainPrizeNFTId: 1000 + roundNum,
    enduranceChampion: `0x${enduranceHash}...`,
    enduranceChampionENS: roundNum === 234 ? "bob.eth" : undefined,
    enduranceChampionPrize: (bids * 10 * 1e18).toString(), // 10 CST per bid
    chronoWarrior: `0x${chronoHash}...`,
    chronoWarriorENS: roundNum === 233 ? "carol.eth" : undefined,
    chronoWarriorPrize: (parseFloat(chronoPrize) * 1e18).toString(),
    raffleTotalETH: (parseFloat(rafflePrize) * 1e18).toString(),
    numRaffleETHWinners: 3,
    numRaffleNFTWinners: 9, // 5 bidders + 4 stakers
    stakingTotalETH: (parseFloat(stakingPrize) * 1e18).toString(),
    charityDonation: (parseFloat(charityAmount) * 1e18).toString(),
    claimedAt: timestamp,
    totalBids: bids,
    totalDonations: Math.floor(deterministicValue(roundNum + 6000, 5, 15)),
    duration: Math.floor(
      deterministicValue(roundNum + 7000, 24 * 3600, 72 * 3600)
    ), // 1-3 days
    ethCollected: (
      (parseFloat(mainPrize) +
        parseFloat(chronoPrize) +
        parseFloat(rafflePrize) +
        parseFloat(stakingPrize) +
        parseFloat(charityAmount)) *
      2 *
      1e18
    ).toString(),
    cstCollected: (bids * 100 * 1e18).toString(), // 100 CST reward per bid
  };
});

// Helper functions
export function getRounds(offset: number = 0, limit: number = 20): RoundData[] {
  return MOCK_ROUNDS.slice(offset, offset + limit);
}

export function getRoundInfo(roundNum: number): RoundData | null {
  return MOCK_ROUNDS.find((r) => r.roundNum === roundNum) || null;
}

export function searchRounds(query: string): RoundData[] {
  const q = query.toLowerCase();
  return MOCK_ROUNDS.filter(
    (r) =>
      r.roundNum.toString().includes(q) ||
      r.winner.toLowerCase().includes(q) ||
      r.winnerENS?.toLowerCase().includes(q)
  );
}

export function getCurrentRound(): RoundData {
  return MOCK_ROUNDS[0]; // Most recent
}
