# Network API Configuration

## Overview

The application now automatically switches API endpoints based on the connected blockchain network. This ensures that API calls are routed to the correct backend for each network.

## API Endpoints by Network

| Network | Chain ID | Port | API Endpoint |
|---------|----------|------|--------------|
| **Local Testnet** | 31337 | 7070 | `http://161.129.67.42:7070/api/cosmicgame/` |
| **Arbitrum Sepolia** | 421614 | 8383 | `http://161.129.67.42:8383/api/cosmicgame/` |
| **Arbitrum One** | 42161 | 8383 | `http://161.129.67.42:8383/api/cosmicgame/` |

## How It Works

### 1. Default Configuration
- **Default Network**: Local Testnet (Chain ID: 31337)
- **Default API Port**: 7070

### 2. Automatic Network Detection
The `useApiNetwork` hook monitors the current blockchain network and automatically updates the API service endpoint when users switch networks.

```typescript
// The hook is integrated in Web3Provider
// No manual configuration needed!
useApiNetwork(); // Automatically syncs API endpoint
```

### 3. Network Switching Flow

```
User switches network in wallet
         ↓
wagmi detects chain change (useChainId)
         ↓
useApiNetwork hook triggers
         ↓
api.setChainId(newChainId) called
         ↓
API base URL updated automatically
         ↓
All subsequent API calls use new endpoint
```

### 4. Proxy Support
The app includes automatic proxy routing for:
- **Development mode** (localhost) - avoids CORS issues
- **Mixed content scenarios** (HTTPS page → HTTP API) - avoids browser security blocks

## Configuration

### Environment Variables (Optional)
You can override the default endpoints using environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL_LOCAL=http://161.129.67.42:7070/api/cosmicgame/
NEXT_PUBLIC_API_BASE_URL_SEPOLIA=http://161.129.67.42:8383/api/cosmicgame/
NEXT_PUBLIC_API_BASE_URL_MAINNET=http://161.129.67.42:8383/api/cosmicgame/
```

## Files Modified

### 1. `src/services/api.ts`
- Added `API_ENDPOINTS` object mapping chain IDs to API URLs
- Added `getApiBaseUrl(chainId)` function
- Added `setChainId(chainId)` method to CosmicSignatureAPI class
- API client now dynamically updates its base URL

### 2. `src/hooks/useApiNetwork.ts` (New)
- New hook that monitors chain changes
- Automatically calls `api.setChainId()` when network switches
- Used internally by Web3Provider

### 3. `src/providers/Web3Provider.tsx`
- Added `ApiNetworkSync` component
- Runs `useApiNetwork()` hook for the entire app
- Ensures API endpoint stays in sync with active network

### 4. `src/lib/web3/chains.ts`
- Changed `defaultChain` from `arbitrumSepoliaChain` to `localTestnet`

### 5. `src/lib/web3/contracts.ts`
- Changed default `CONTRACTS` export from `ARBITRUM_SEPOLIA_CONTRACTS` to `LOCAL_TESTNET_CONTRACTS`

## Testing

### Test Local Testnet (Default)
1. Connect wallet to the app
2. Wallet should prompt to switch to "Localhost 22945" (Chain ID: 31337)
3. API calls should go to port 7070
4. Check console logs: "API endpoint switched to http://161.129.67.42:7070/api/cosmicgame/ for chain 31337"

### Test Arbitrum Sepolia
1. Switch network in wallet to Arbitrum Sepolia
2. API calls should automatically switch to port 8383
3. Check console logs: "API endpoint switched to http://161.129.67.42:8383/api/cosmicgame/ for chain 421614"

### Test Network Switching
1. Switch between networks in your wallet
2. Watch the console logs to verify endpoint changes
3. Verify API calls return data from the correct backend

## Troubleshooting

### API calls fail after switching networks
- Check the console for "API endpoint switched to..." messages
- Verify the backend is running on the expected port
- Check browser network tab to see which URL is being called

### Wallet won't switch to local testnet
- The network may need to be added to your wallet
- The app will automatically prompt to add it via MetaMask
- RPC URL: `http://161.129.67.42:22945`
- Chain ID: 31337 (0x7A69)

### Mixed content errors
- The app includes automatic proxy routing
- If you still see errors, ensure the proxy API route is working: `/api/proxy`
- Check `src/app/api/proxy/route.ts`

## Future Enhancements

- Add API health checks per network
- Cache API responses per network
- Add fallback endpoints for redundancy
- Add network status indicators in UI

