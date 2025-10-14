# Network Switching Guide

## Overview

This guide explains the automatic network switching functionality implemented in the Cosmic Signature application. The system ensures users are always connected to the correct network (Local Testnet) and automatically prompts them to switch or add the network if needed.

## Features

✅ **Automatic Network Detection** - Detects when users are on the wrong network  
✅ **One-Click Network Switching** - Users can switch networks with a single click  
✅ **Automatic Network Addition** - If the network doesn't exist in MetaMask, it's automatically added  
✅ **Beautiful UI** - Luxury-themed modal with glassmorphism effects  
✅ **Non-Dismissible Guard** - Users must switch to the correct network to use the app  
✅ **Error Handling** - Graceful error messages if something goes wrong

## Implementation Details

### 1. Network Configuration (`src/lib/web3/chains.ts`)

The local testnet is configured with the following details:

```typescript
export const localTestnet: Chain = {
  id: 31337,
  name: "Localhost 22945",
  nativeCurrency: {
    name: "AGOR",
    symbol: "AGOR",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://161.129.67.42:22945"],
    },
  },
  testnet: true,
};

export const defaultChain = localTestnet;
```

### 2. Network Switch Hook (`src/hooks/useNetworkSwitch.ts`)

Custom React hook that provides network switching functionality:

```typescript
const {
  isCorrectNetwork,    // Whether user is on correct network
  isSwitching,         // Whether switch is in progress
  error,               // Error message if switch failed
  switchToRequiredNetwork, // Function to trigger switch
  isConnected,         // Whether wallet is connected
} = useNetworkSwitch();
```

#### How It Works

1. **Detects Current Network**: Uses wagmi's `useChainId()` hook
2. **Checks if Correct**: Compares with `defaultChain.id`
3. **Attempts Switch**: First tries wagmi's `switchChain()`
4. **Falls Back to MetaMask**: If wagmi fails, uses `window.ethereum.request()`
5. **Adds Network if Missing**: If error code 4902, calls `wallet_addEthereumChain`

#### Network Addition Flow

When the network doesn't exist in MetaMask:

```typescript
await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [{
    chainId: "0x7A69", // 31337 in hex
    chainName: "Localhost 22945",
    nativeCurrency: {
      name: "AGOR",
      symbol: "AGOR",
      decimals: 18,
    },
    rpcUrls: ["http://161.129.67.42:22945"],
    blockExplorerUrls: ["http://161.129.67.42:22945"],
  }],
});
```

### 3. Network Switch Guard Component (`src/components/web3/NetworkSwitchGuard.tsx`)

Modal component that displays when users need to switch networks:

**Features:**
- 🎨 Beautiful luxury-themed modal
- 🔒 Blocks all interaction until network is switched
- ⚡ Auto-triggers network switch on detection
- 📱 Responsive design
- 🎯 Shows network details (Chain ID, RPC URL, etc.)
- ⏳ Loading states during switch
- ❌ Error messages with retry option

**Placement:**
```typescript
<Web3Provider>
  <NetworkSwitchGuard />  {/* Added here */}
  <YourApp />
</Web3Provider>
```

### 4. Root Layout Integration (`src/app/layout.tsx`)

The guard is placed inside the Web3Provider at the root level:

```typescript
<Web3Provider>
  <NetworkSwitchGuard />
  <NotificationProvider>
    <ApiDataProvider>
      {/* Rest of app */}
    </ApiDataProvider>
  </NotificationProvider>
</Web3Provider>
```

### 5. Web3 Provider Configuration (`src/providers/Web3Provider.tsx`)

Updated to set initial chain:

```typescript
<RainbowKitProvider
  theme={darkTheme()}
  modalSize="compact"
  showRecentTransactions={true}
  coolMode
  initialChain={defaultChain}  // Sets default to local testnet
>
  {children}
</RainbowKitProvider>
```

## User Experience Flow

### First-Time User

1. User visits the website
2. Clicks "Connect Wallet"
3. Selects MetaMask and approves connection
4. If on wrong network:
   - Modal appears immediately
   - Auto-triggers network switch after 500ms
   - If network doesn't exist: MetaMask prompts to add it
   - User approves the addition
   - Network switches automatically
5. Modal disappears, user can access the app

### Returning User (Has Network)

1. User visits the website
2. Clicks "Connect Wallet"
3. If on wrong network:
   - Modal appears
   - Auto-triggers switch
   - MetaMask asks to switch network
   - User approves
4. Modal disappears

### Already on Correct Network

1. User visits website
2. Connects wallet
3. No modal appears
4. Can immediately use the app

## Error Handling

### Network Switch Failed
```
"Failed to switch network. Please switch manually in MetaMask."
```
→ User can click button to retry

### Network Addition Failed
```
"Failed to add network. Please add it manually in MetaMask."
```
→ Shows network details for manual addition

### MetaMask Not Detected
```
"MetaMask not detected. Please install MetaMask."
```
→ Guides user to install MetaMask

## Manual Network Addition

If automatic addition fails, users can add the network manually:

1. Open MetaMask
2. Click network dropdown
3. Click "Add Network" or "Add Network Manually"
4. Enter the following details:
   - **Network Name**: Localhost 22945
   - **RPC URL**: http://161.129.67.42:22945
   - **Chain ID**: 31337
   - **Currency Symbol**: AGOR
5. Click "Save"

## Testing

### Test Wrong Network Detection
1. Connect MetaMask to Ethereum Mainnet
2. Connect wallet on the site
3. Should see network switch modal

### Test Network Addition
1. Remove "Localhost 22945" from MetaMask networks
2. Connect wallet
3. Should prompt to add network
4. Approve in MetaMask
5. Network should be added and selected

### Test Already Correct Network
1. Set MetaMask to "Localhost 22945"
2. Connect wallet
3. Should not see modal

## Troubleshooting

### Modal Keeps Appearing
- Check if MetaMask is actually on the correct network
- Try manually switching in MetaMask
- Clear browser cache and reconnect

### Cannot Add Network
- Ensure RPC URL is accessible: http://161.129.67.42:22945
- Check MetaMask version (update if needed)
- Try adding manually in MetaMask settings

### Switch Button Does Nothing
- Check browser console for errors
- Ensure MetaMask is unlocked
- Try refreshing the page and reconnecting

## Configuration Changes

### To Change Required Network

1. Update `defaultChain` in `src/lib/web3/chains.ts`:
```typescript
export const defaultChain = arbitrumSepoliaChain; // or any other chain
```

2. The `useNetworkSwitch` hook and `NetworkSwitchGuard` will automatically use the new default

### To Add More Networks

Add to `supportedChains` array in `src/lib/web3/chains.ts`:
```typescript
export const supportedChains: Chain[] = [
  localTestnet,
  arbitrumSepoliaChain,
  arbitrumOne,
  yourNewChain, // Add here
];
```

## Browser Compatibility

- ✅ Chrome/Brave with MetaMask
- ✅ Firefox with MetaMask
- ✅ Edge with MetaMask
- ✅ Safari with MetaMask (limited support)

## Security Considerations

1. **RPC URL Validation**: The RPC URL is hardcoded and validated
2. **No Private Keys**: Network switching doesn't require private keys
3. **User Approval**: All network operations require user confirmation in MetaMask
4. **HTTPS Recommended**: For production, use HTTPS for RPC URLs

## Future Enhancements

- [ ] Add support for multiple network options (user choice)
- [ ] Remember user's network preference
- [ ] Add network health check before switching
- [ ] Support other wallets (Coinbase, WalletConnect)
- [ ] Add network switch history/logs

## Resources

- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [MetaMask Ethereum Provider API](https://docs.metamask.io/wallet/reference/provider-api/)
- [EIP-3085: wallet_addEthereumChain](https://eips.ethereum.org/EIPS/eip-3085)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify MetaMask is installed and up to date
4. Check network connectivity to RPC URL

