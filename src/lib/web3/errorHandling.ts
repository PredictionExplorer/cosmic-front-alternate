/**
 * Error Handling Utilities
 *
 * Provides user-friendly error messages for common contract errors.
 * Maps technical error messages to human-readable explanations.
 */

/**
 * Known contract error types from CosmicSignatureErrors.sol
 */
export const CONTRACT_ERRORS = {
	FirstRound: 'This action is not allowed during the first round',
	RoundIsInactive: 'The current round has not started yet',
	RoundIsActive: 'This action cannot be performed while the round is active',
	NoBidsPlacedInCurrentRound: 'No bids have been placed in this round yet',
	BidHasBeenPlacedInCurrentRound: 'A bid has already been placed in this round',
	WrongBidType: 'The first bid in a round must be with ETH',
	InsufficientReceivedBidAmount: 'Insufficient amount sent for bid. Price may have increased.',
	TooLongBidMessage: 'Bid message is too long (max 280 characters)',
	UsedRandomWalkNft: 'This RandomWalk NFT has already been used',
	CallerIsNotNftOwner: 'You are not the owner of this NFT',
	MainPrizeEarlyClaim: 'Not enough time has elapsed to claim the prize',
	MainPrizeClaimDenied: 'Only the last bidder can claim before the timeout expires',
	TooLongNftName: 'NFT name is too long (max 32 characters)',
	EthWithdrawalDenied: 'You cannot withdraw this prize yet',
	DonatedTokenClaimDenied: 'You cannot claim this donated token yet',
	DonatedNftClaimDenied: 'You cannot claim this donated NFT yet',
	InvalidDonatedNftIndex: 'Invalid donated NFT index',
	DonatedNftAlreadyClaimed: 'This NFT has already been claimed',
	NftHasAlreadyBeenStaked: 'This NFT has already been staked before',
	NftStakeActionInvalidId: 'Invalid stake action ID',
	NftStakeActionAccessDenied: 'You do not have permission to unstake this NFT',
	UnauthorizedCaller: 'You are not authorized to perform this action',
	FundTransferFailed: 'ETH transfer failed',
	ZeroAddress: 'Invalid address provided',
	InvalidOperationInCurrentState: 'This operation is not allowed at this time'
} as const;

/**
 * Parse contract error and return user-friendly message
 *
 * @param error - Error object from contract call
 * @returns User-friendly error message
 */
export function parseContractError(error: unknown): string {
	// User rejected transaction
	const errorObj = error as Record<string, unknown>;
	if (errorObj?.code === 4001 || errorObj?.code === 'ACTION_REJECTED') {
		return 'Transaction was rejected';
	}

	// Extract error message
	let errorMessage = '';

	if (typeof errorObj?.reason === 'string') {
		errorMessage = errorObj.reason;
	} else if (typeof errorObj?.message === 'string') {
		errorMessage = errorObj.message;
	} else if (typeof error === 'string') {
		errorMessage = error;
	}

	// Check for known contract errors
	for (const [errorName, friendlyMessage] of Object.entries(CONTRACT_ERRORS)) {
		if (errorMessage.includes(errorName)) {
			return friendlyMessage;
		}
	}

	// Common error patterns
	if (errorMessage.includes('insufficient funds')) {
		return 'Insufficient ETH balance for this transaction';
	}

	if (errorMessage.includes('gas required exceeds')) {
		return 'Transaction would fail - please check requirements';
	}

	if (errorMessage.includes('nonce')) {
		return 'Transaction error - please try again';
	}

	if (errorMessage.includes('already known')) {
		return 'Transaction already submitted - please wait';
	}

	if (errorMessage.includes('replacement transaction underpriced')) {
		return 'Transaction pending - please wait or increase gas price';
	}

	// Generic fallback
	if (errorMessage) {
		// Clean up error message
		errorMessage = errorMessage.replace(/^Error: /, '');
		errorMessage = errorMessage.replace(/execution reverted: /, '');
		return errorMessage;
	}

	return 'Transaction failed. Please try again.';
}

/**
 * Check if error is a user rejection
 *
 * @param error - Error object
 * @returns True if user rejected transaction
 */
export function isUserRejectionError(error: unknown): boolean {
	const errorObj = error as Record<string, unknown>;
	return (
		errorObj?.code === 4001 ||
		errorObj?.code === 'ACTION_REJECTED' ||
		(typeof errorObj?.message === 'string' && errorObj.message.includes('user rejected'))
	);
}

/**
 * Check if error is due to insufficient balance
 *
 * @param error - Error object
 * @returns True if insufficient balance
 */
export function isInsufficientBalanceError(error: unknown): boolean {
	const errorObj = error as Record<string, unknown>;
	const message =
		(typeof errorObj?.message === 'string' ? errorObj.message : '') ||
		(typeof errorObj?.reason === 'string' ? errorObj.reason : '');
	return message.includes('insufficient funds') || message.includes('insufficient balance');
}

/**
 * Extract error details for logging/debugging
 *
 * @param error - Error object
 * @returns Structured error details
 */
export function extractErrorDetails(error: unknown): {
	code?: number | string;
	message: string;
	reason?: string;
	data?: unknown;
} {
	const errorObj = error as Record<string, unknown>;
	return {
		code: errorObj?.code as number | string | undefined,
		message: typeof errorObj?.message === 'string' ? errorObj.message : 'Unknown error',
		reason: errorObj?.reason as string | undefined,
		data: errorObj?.data
	};
}
