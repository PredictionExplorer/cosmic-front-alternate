/**
 * Contract addresses come from the dashboard API (`ContractAddrs`), not from env or hardcoded maps.
 */

import type { Address } from 'viem';
import type { ApiDashboardData } from '@/services/apiTypes';

/** Normalized addresses matching the former `CONTRACTS` shape (keys are frontend names). */
export interface CosmicContractAddresses {
	COSMIC_GAME: Address;
	COSMIC_SIGNATURE_TOKEN: Address;
	COSMIC_SIGNATURE_NFT: Address;
	RANDOM_WALK_NFT: Address;
	PRIZES_WALLET: Address;
	STAKING_WALLET_CST: Address;
	STAKING_WALLET_RWLK: Address;
	CHARITY_WALLET: Address;
	MARKETING_WALLET: Address;
	COSMIC_DAO: Address;
}

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;
const ZERO = '0x0000000000000000000000000000000000000000';

export function isValidContractAddress(address: string): address is Address {
	return ADDR_RE.test(address);
}

/** True for a syntactically valid non-zero address (does not check on-chain bytecode). */
export function isDeployedAddress(address: string): boolean {
	return isValidContractAddress(address) && address.toLowerCase() !== ZERO;
}

function pickAddr(obj: Record<string, unknown>, key: string): Address | null {
	const v = obj[key];
	if (typeof v !== 'string' || !isValidContractAddress(v)) return null;
	return v;
}

/**
 * Parse `statistics/dashboard` payload. Returns `null` until `ContractAddrs` is present and complete.
 */
export function contractAddressesFromDashboard(
	dashboard: ApiDashboardData | null | undefined,
): CosmicContractAddresses | null {
	if (!dashboard) return null;
	const raw = (dashboard as unknown as Record<string, unknown>).ContractAddrs;
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const c = raw as Record<string, unknown>;

	const COSMIC_GAME = pickAddr(c, 'CosmicGameAddr');
	const COSMIC_SIGNATURE_TOKEN = pickAddr(c, 'CosmicTokenAddr');
	const COSMIC_SIGNATURE_NFT = pickAddr(c, 'CosmicSignatureAddr');
	const RANDOM_WALK_NFT = pickAddr(c, 'RandomWalkAddr');
	const PRIZES_WALLET = pickAddr(c, 'PrizesWalletAddr');
	const STAKING_WALLET_CST = pickAddr(c, 'StakingWalletCSTAddr');
	const STAKING_WALLET_RWLK = pickAddr(c, 'StakingWalletRWalkAddr');
	const CHARITY_WALLET = pickAddr(c, 'CharityWalletAddr');
	const MARKETING_WALLET = pickAddr(c, 'MarketingWalletAddr');
	const COSMIC_DAO = pickAddr(c, 'CosmicDaoAddr');

	if (
		!COSMIC_GAME ||
		!COSMIC_SIGNATURE_TOKEN ||
		!COSMIC_SIGNATURE_NFT ||
		!RANDOM_WALK_NFT ||
		!PRIZES_WALLET ||
		!STAKING_WALLET_CST ||
		!STAKING_WALLET_RWLK ||
		!CHARITY_WALLET ||
		!MARKETING_WALLET ||
		!COSMIC_DAO
	) {
		return null;
	}

	return {
		COSMIC_GAME,
		COSMIC_SIGNATURE_TOKEN,
		COSMIC_SIGNATURE_NFT,
		RANDOM_WALK_NFT,
		PRIZES_WALLET,
		STAKING_WALLET_CST,
		STAKING_WALLET_RWLK,
		CHARITY_WALLET,
		MARKETING_WALLET,
		COSMIC_DAO,
	};
}
