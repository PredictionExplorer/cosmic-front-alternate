# 🌐 Network Configuration

## Current Setup: Arbitrum Sepolia (Testnet)

The application is currently configured for **Arbitrum Sepolia testnet** (Chain ID: 421614).

---

## Supported Networks

### 1. Arbitrum Sepolia (Default - Testnet)

-   **Chain ID:** 421614
-   **RPC:** https://sepolia-rollup.arbitrum.io/rpc
-   **Explorer:** https://sepolia.arbiscan.io
-   **Purpose:** Development and testing
-   **Faucet:** https://sepolia-faucet.arbitrum.io (get test ETH)

### 2. Arbitrum One (Mainnet)

-   **Chain ID:** 42161
-   **RPC:** https://arb1.arbitrum.io/rpc
-   **Explorer:** https://arbiscan.io
-   **Purpose:** Production deployment

### 3. Local Network (Development)

-   **Chain ID:** 31337
-   **RPC:** http://127.0.0.1:8545
-   **Purpose:** Local Hardhat/Foundry testing

---

## How to Connect to Arbitrum Sepolia

### In MetaMask:

1. **Click Networks dropdown** (top of MetaMask)
2. **Click "Add Network"** or "Add a network manually"
3. **Enter Details:**
    - Network Name: `Arbitrum Sepolia`
    - RPC URL: `https://sepolia-rollup.arbitrum.io/rpc`
    - Chain ID: `421614`
    - Currency Symbol: `ETH`
    - Block Explorer: `https://sepolia.arbiscan.io`
4. **Save**

### Or Use Chainlist:

Visit: https://chainlist.org/?search=arbitrum+sepolia&testnets=true

-   Click "Connect Wallet"
-   Click "Add to MetaMask"
-   Approve in wallet

---

## Get Testnet ETH

### Arbitrum Sepolia Faucet:

1. **Visit:** https://sepolia-faucet.arbitrum.io
2. **Connect wallet**
3. **Request test ETH**
4. **Wait ~30 seconds**
5. **Check balance in wallet**

### Alternative Faucets:

-   Alchemy Sepolia Faucet
-   QuickNode Faucet
-   Ask in Discord for testnet tokens

---

## Switching Networks

### To Switch Default Network:

Edit `/src/lib/web3/chains.ts`:

```typescript
// For Testnet (current):
export const defaultChain = arbitrumSepoliaChain;

// For Mainnet (production):
export const defaultChain = arbitrumOne;

// For Local Development:
export const defaultChain = localNetwork;
```

### Why Sepolia for Testing?

✅ **Free test ETH** - No real money needed
✅ **Safe testing** - Can't lose real funds
✅ **Fast iterations** - Test without consequences
✅ **Same as mainnet** - Identical contract behavior
✅ **Public testnet** - Others can test too

---

## Contract Addresses

**IMPORTANT:** Contract addresses are **different on each network**.

### Current (Testnet):

Update `/src/lib/web3/contracts.ts` with your **Sepolia** contract addresses.

### Production (Mainnet):

Will need different addresses when deploying to mainnet.

---

## Verifying Your Connection

### In Browser:

1. **Connect Wallet**
2. **Check network indicator in wallet**
3. **Should show: "Arbitrum Sepolia"**
4. **If wrong network:** Wallet will show "Wrong Network" button

### In Console:

```javascript
// Check current chain
window.ethereum.request({ method: 'eth_chainId' });
// Should return: "0x66eee" (421614 in hex)
```

---

## Common Issues

### "Wrong Network" Error?

**Solution:**

-   Your wallet is on a different network
-   Click "Switch Network" button
-   Or manually switch to Arbitrum Sepolia in wallet

### Can't Connect?

**Check:**

1. Is Arbitrum Sepolia added to your wallet?
2. Do you have test ETH?
3. Is RPC URL correct?
4. Try refreshing page

### Transactions Failing?

**Check:**

1. Do you have enough test ETH for gas?
2. Are contract addresses correct for Sepolia?
3. Is the contract deployed on Sepolia?
4. Check Sepolia explorer for contract

---

## For Production Deployment

### When Ready for Mainnet:

1. **Switch Default Chain:**

    ```typescript
    export const defaultChain = arbitrumOne;
    ```

2. **Update Contract Addresses:**

    - Deploy contracts to Arbitrum One
    - Update all addresses in `/src/lib/web3/contracts.ts`

3. **Update API URLs:**

    - Point to production API
    - Update `.env.local`

4. **Test Thoroughly:**

    - Test on mainnet with small amounts first
    - Verify all features work
    - Check all contract addresses

5. **Deploy Frontend:**
    - Build production bundle
    - Deploy to hosting
    - Update DNS

---

_Network: Arbitrum Sepolia (Testnet)_
_Chain ID: 421614_
_Status: Active for Testing_
