Read ~/lif-kernel/CLAUDE.md first. This file adds BlueWallet-lif specifics.

# BlueWallet-lif

BlueWallet (React Native Bitcoin wallet) on the web, on lif-kernel, with
LIF coin wallets. Repo: `lif-zone/BlueWallet`, fork of `BlueWallet/BlueWallet`.

## Layers

One repo, four branches, each a git worktree. Each adds to the one above.

| Branch  | Directory            | Holds                                     |
|---------|----------------------|-------------------------------------------|
| fixes   | ~/BlueWallet-fixes   | fixes to offer upstream                   |
| web2    | ~/BlueWallet-web     | web port: `web/`, `lif` of `package.json` |
| anycoin | ~/BlueWallet-anycoin | original files made coin-neutral          |
| master  | ~/BlueWallet-lif     | LIF: `lifcoin/` (holds `.git`)            |

- A change goes in the first layer of the table it fits.
- fixes, web2: original files identical to upstream.
- anycoin: edits original files. Never names LIF. Bitcoin acts as before.
- master: `lifcoin/`, plus one import line in `class/wallet-types.ts`.
- Merge down only: `cd ~/BlueWallet-<lower> && git merge --no-edit <upper>`,
  layer by layer to master.
- The user commits, merges, pushes. Give the commands: one `&&` sequence,
  `\` at line ends, directories named. `git add -u` plus new files by
  name. Never `git add -A`.
- `diff.context` is 0 here. For a patch: `git diff -U3`.
- A file open in vim (`.name.swp`): do not edit. Show the code.
- Root `CLAUDE.md` is upstream's: do not edit. Web port: `web/CLAUDE.md`.

## Code style

- Original files: BlueWallet style (prettier, 140 columns).
- `web/`, `lifcoin/`: lif-kernel conventions, 2 spaces, 80 columns.
- BlueWallet bugs that do not block: 1-2 lines in `web/tasks.txt`, no fix.
- lif-kernel bugs: tell the user. No silent workaround.

## Run

```
cd ~/BlueWallet-lif && node ~/lif-kernel/web/serve.js -p 4210
```

- 4210: the app. Run from the layer directory under test.
- 4211: lif-kernel test instance. Always `--no-peer`. Chrome debug: 9222.
- Module URL: `/.lif/local/bluewallet//<path>?mjs`.
- After a code change: fetch `/.lif/kernel/cache_clear`, then
  `/.lif/kernel/terminate`, then reload.
- No working tsc, eslint, prettier. Verify in the app. Check line length.
- Test an anycoin edit before commit: `git diff -U3` there, `git apply`
  in ~/BlueWallet-lif, test, `git apply -R`.

## TCP sockets

`web/stubs/react-native-tcp-socket.js` replaces `react-native-tcp-socket`
(`lif.dependencies`). BlueWallet uses it as `net` and `tls` of Node.js.

- `Socket`: `tcp_sock` of `lif-kernel/net/tcpip.js`. A lif-net out node
  makes the real connection.
- `TLSSocket(socket, opt)`: wraps a `Socket`. Sets `socket.opt.tls`.
  Forwards events and methods. TLS ends at the out node.
- An `error` event without a listener is dropped, not thrown: `tcp_sock`
  does it, `TLSSocket` repeats it.
- lif-net is IPv4 only.

## LIF Electrum client

`lifcoin/electrum.ts`: what a wallet needs from an Electrum client
(`TWalletElectrum` in `class/wallets/legacy-wallet.ts`). A wallet reaches
its client by `wallet.electrum`. Bitcoin: `blue_modules/BlueElectrum.ts`.

Differs from BlueElectrum:
- Server: the LIF node, lifnet topic `lifcoin/electrum`. No out node, no
  TCP, no server list, no server settings.
- Connects on first use. Offline mode of Settings does not apply.
- Verbose transactions are built from the hex: the node gives few fields.
- No `blockchain.scripthash.get_mempool`: mempool comes from the history.
- One fee rate, about 5000 sat/vbyte.
- Caches in memory only: transaction hex, transaction block, block time.

## LIF coin

- `lifcoin/network.ts`: bech32 `lif`, coin type 1842 (`m/84'/1842'/0'`).
  Addresses `1...`, `3...` are written as on Bitcoin: Send warns.
- Price: 0.01 USD, fixed (`lif_coin.price`). No network price yet.
- `lifcoin/hd_lif_wallet.ts`: `HDLifWallet`, an `HDSegwitBech32Wallet`.
- `lifcoin/index.ts`: registers the wallet type, the Add Wallet option,
  the mnemonic importer (`class/wallet-registry.ts`).

## Tests

- The user's Bitcoin test mnemonic is a real wallet. Never broadcast from
  it: stop at the Confirm screen. Never print a mnemonic.
- LIF test wallet "claude lif test" holds the user's LIF. Keys:
  `~/claude_lif.json`. Never press "Send now": the user does.
- By day: a sanity test only. Full and negative tests at night.
- Log each code change in `~/lif-coin/prompt.txt`: `USER:`, `CLAUDE:`, `---`.
