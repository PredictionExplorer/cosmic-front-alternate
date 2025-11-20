# Network Configuration via Environment Variables

## Overview

The application uses the network specified in the `NEXT_PUBLIC_DEFAULT_NETWORK` environment variable for ALL API calls. This allows you to easily switch between Local Testnet, Arbitrum Sepolia, and Arbitrum One without changing code.

**Important:** The API endpoint is controlled by the ENV file, NOT by MetaMask network selection. This ensures consistent API behavior regardless of which network users have selected in their wallet.

## Quick Start

### 1. Create `.env.local` file

Create a `.env.local` file in the root of your project:

```bash
# Set default network: "local" | "sepolia" | "mainnet"
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
```

### 2. Restart the development server

```bash
npm run dev
```

The app will now use Arbitrum Sepolia as the default network!

## Configuration Options

### `NEXT_PUBLIC_DEFAULT_NETWORK`

**Type:** `"local"` | `"sepolia"` | `"mainnet"`  
**Default:** `"local"`  

Sets the default network for:
- Wallet connection (which network to prompt users to connect to)
- API endpoint (which backend to fetch data from)
- Smart contract addresses (which deployed contracts to use)

### Network Details

| Value | Network | Chain ID | API Port | Description |
|-------|---------|----------|----------|-------------|
| `local` | Local Testnet | 31337 | 7070 | Local development testnet |
| `sepolia` | Arbitrum Sepolia | 421614 | 8353 | Arbitrum testnet |
| `mainnet` | Arbitrum One | 42161 | 8383 | Arbitrum mainnet |

## Example Configurations

### Development (Local Testnet)

```bash
# .env.local
NEXT_PUBLIC_DEFAULT_NETWORK=local
```

### Testing (Arbitrum Sepolia)

```bash
# .env.local
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
```

### Production (Arbitrum One)

```bash
# .env.local
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
```

## Advanced: Custom API Endpoints

You can also override the API endpoints for each network:

```bash
# .env.local
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia

# Optional: Override API endpoints
NEXT_PUBLIC_API_BASE_URL_LOCAL=http://161.129.67.42:7070/api/cosmicgame/
NEXT_PUBLIC_API_BASE_URL_SEPOLIA=http://161.129.67.42:8353/api/cosmicgame/
NEXT_PUBLIC_API_BASE_URL_MAINNET=http://161.129.67.42:8383/api/cosmicgame/
```

## How It Works

### 1. Network Configuration (`src/lib/networkConfig.ts`)

Central configuration file that:
- Reads `NEXT_PUBLIC_DEFAULT_NETWORK` environment variable
- Provides network mappings (chain ID, API port, name)
- Exports helper functions for network detection

### 2. Automatic Configuration

The following are automatically configured based on the environment variable:

#### API Service (`src/services/api.ts`)
- Default API endpoint
- Default chain ID for API calls

#### Web3 Chains (`src/lib/web3/chains.ts`)
- Default chain for wallet connection
- Initial network prompt

#### Smart Contracts (`src/lib/web3/contracts.ts`)
- Default contract addresses based on network

#### Network Sync Hook (`src/hooks/useApiNetwork.ts`)
- Uses centralized network configuration

## Environment Variables Reference

### Required

```bash
# Default network (local, sepolia, mainnet)
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
```

### Optional (with defaults)

```bash
# API Endpoints (auto-configured based on network if not set)
NEXT_PUBLIC_API_BASE_URL_LOCAL=http://161.129.67.42:7070/api/cosmicgame/
NEXT_PUBLIC_API_BASE_URL_SEPOLIA=http://161.129.67.42:8353/api/cosmicgame/
NEXT_PUBLIC_API_BASE_URL_MAINNET=http://161.129.67.42:8383/api/cosmicgame/

# Asset server
NEXT_PUBLIC_ASSETS_BASE_URL=https://nfts.cosmicsignature.com/
```

## Deployment

### Vercel

Set environment variables in your Vercel project settings:

1. Go to Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_DEFAULT_NETWORK` with value `sepolia` or `mainnet`
3. Redeploy

### Other Platforms

Set the `NEXT_PUBLIC_DEFAULT_NETWORK` environment variable in your deployment platform's configuration.

## Troubleshooting

### Changes not taking effect

1. **Restart dev server** - Environment variables are read at build time
2. **Clear cache** - Delete `.next` folder and restart
3. **Check variable name** - Must start with `NEXT_PUBLIC_`

### Wrong network on load

1. Check `.env.local` file exists in project root
2. Verify variable name is exactly `NEXT_PUBLIC_DEFAULT_NETWORK`
3. Check spelling of network value (`local`, `sepolia`, or `mainnet`)
4. Look for console log on app load showing the detected network

### API calls failing

1. Verify the API endpoint is accessible
2. Check that the backend is running on the expected port
3. Review browser console for error messages
4. Confirm CORS/proxy settings if needed

## Console Output

When the app loads in development mode, you'll see:

```
[Network Config] Default network: Arbitrum Sepolia (Chain ID: 421614, API Port: 8353)
[useApiNetwork] Connected to Arbitrum Sepolia (Chain ID: 421614)
API endpoint switched to http://161.129.67.42:8353/api/cosmicgame/ for chain 421614
```

This confirms the network configuration is working correctly.

## Benefits

✅ **Easy switching** - Change networks without code changes  
✅ **Environment-specific** - Different networks for dev/staging/prod  
✅ **Team coordination** - Everyone uses same network with shared config  
✅ **Deployment ready** - Set via platform environment variables  
✅ **Type-safe** - Full TypeScript support with centralized config  

## Next Steps

1. Create `.env.local` in project root
2. Set `NEXT_PUBLIC_DEFAULT_NETWORK=sepolia`
3. Restart dev server
4. Verify console logs show correct network
5. Test wallet connection and API calls

Done! Your app now uses environment-based network configuration. 🎯

