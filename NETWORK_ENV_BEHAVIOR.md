# Network & API Endpoint Behavior

## Current Behavior

The application **ALWAYS** uses the network specified in the `.env.local` file for API calls, regardless of:
- Whether MetaMask is connected
- Which network is selected in MetaMask
- User's wallet network preference

## Configuration

Set the API network in `.env.local`:

```bash
# Options: "local" | "sepolia" | "mainnet"
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
```

## Network Mapping

| ENV Value | Network | Chain ID | API Port |
|-----------|---------|----------|----------|
| `local` | Local Testnet | 31337 | 7070 |
| `sepolia` | Arbitrum Sepolia | 421614 | 8353 |
| `mainnet` | Arbitrum One | 42161 | 8383 |

## How It Works

1. **App loads** → `useApiNetwork` hook runs
2. **Reads ENV** → Gets `NEXT_PUBLIC_DEFAULT_NETWORK`
3. **Sets API endpoint** → All API calls use this network
4. **Stays fixed** → Never changes based on wallet

## Example Scenarios

### Scenario 1: ENV = Sepolia, Wallet = Local
```
ENV: NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
Wallet Network: Local Testnet (31337)
Result: API uses Sepolia (port 8353) ✅
```

### Scenario 2: ENV = Sepolia, No Wallet
```
ENV: NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
Wallet: Not connected
Result: API uses Sepolia (port 8353) ✅
```

### Scenario 3: ENV = Local, Wallet = Sepolia
```
ENV: NEXT_PUBLIC_DEFAULT_NETWORK=local
Wallet Network: Arbitrum Sepolia (421614)
Result: API uses Local (port 7070) ✅
```

## Why This Approach?

### Benefits:
✅ **Consistent API behavior** - All users on same deployment hit same backend  
✅ **Deployment flexibility** - Different environments (dev/staging/prod) use different backends  
✅ **No user confusion** - API doesn't change when users switch networks  
✅ **Simpler testing** - Developers control which backend to test against  

### Use Cases:
- **Development:** Set to `local` to test against local backend
- **Staging:** Set to `sepolia` for testnet deployment
- **Production:** Set to `mainnet` for production deployment

## Console Output

When the app loads, you'll see:

```
[useApiNetwork] Using network from ENV: Arbitrum Sepolia (Chain ID: 421614)
API endpoint switched to http://161.129.67.42:8353/api/cosmicgame/ for chain 421614
```

## Important Notes

⚠️ **Wallet Network vs API Network**
- Wallet network: Controls which blockchain for transactions
- API network: Controls which backend for data fetching
- These are **independent** of each other

⚠️ **User Responsibility**
- Users should manually switch their wallet to match the app's expected network
- The app won't automatically switch their wallet network
- Contract interactions will fail if wallet is on wrong network

⚠️ **Contract Addresses**
- Contract addresses are also loaded from ENV configuration
- They match the API network setting
- This ensures consistency between API data and blockchain interactions

## Changing Networks

To change the network:

1. **Update `.env.local`**
   ```bash
   NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
   ```

2. **Restart dev server**
   ```bash
   yarn dev
   ```

3. **Verify in console**
   - Check for `[useApiNetwork]` log message
   - Verify correct chain ID and port

## Related Files

- `src/hooks/useApiNetwork.ts` - Sets API endpoint from ENV
- `src/lib/networkConfig.ts` - Network configuration logic
- `src/services/api.ts` - API service with endpoint management
- `.env.local` - Environment configuration (create this file)

## Summary

The API endpoint is **environment-controlled**, not **wallet-controlled**. This provides a stable, predictable behavior for all users and simplifies deployment management.

