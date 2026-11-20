Read ~/lif-kernel/CLAUDE.md first. This file adds BlueWallet-lif specifics.

## Layers

BlueWallet on the web, on lif-kernel, with LIF coin wallets. One repo
(`lif-zone/BlueWallet`, fork of `BlueWallet/BlueWallet`), four branches,
each a git worktree. Each adds to the one above.

| Branch  | Directory            | Holds                                     |
|---------|----------------------|-------------------------------------------|
| fixes   | ~/BlueWallet-fixes   | fixes to offer upstream                   |
| web2    | ~/BlueWallet-web     | web port: `web/`, `lif` of `package.json` |
| anycoin | ~/BlueWallet-anycoin | original files made coin-neutral          |
| master  | ~/BlueWallet-lif     | LIF: `lifcoin/` (holds `.git`)            |

- A change goes in the first layer of the table it fits. Edit the file in
  the directory of that layer, not in ~/BlueWallet-lif.
- fixes, web2: original files identical to upstream.
- anycoin: edits original files. Never names LIF. Bitcoin acts as before.
- master: `lifcoin/`, plus one import line in `class/wallet-types.ts`.
- Do not edit: root `CLAUDE.md` (upstream's), a file open in vim
  (`.name.swp`: show the code). Web port rules: `web/CLAUDE.md`.

## Commit and merge

Never commit, merge or push. The user does, and knows git little: give
the exact commands as one sequence, ready to paste: `&& \` ends each line,
`cd` names each directory. Example: a change in web2, with a new file, and
a change in `lifcoin/`:

```
cd ~/BlueWallet-web && \
git add -u && \
git add web/new_file.js && \
git commit -m "web: what changed" && \
git push && \
cd ~/BlueWallet-anycoin && \
git merge --no-edit web2 && \
git push && \
cd ~/BlueWallet-lif && \
git merge --no-edit anycoin && \
git add lifcoin/index.ts && \
git commit -m "lifcoin: what changed" && \
git push
```

- Start at the first changed layer. Then merge into each layer below it,
  in table order, down to master. Never merge upward. Never skip a layer.
- A lower layer with its own change: merge first, then add and commit.
- `git add -u`, plus each new file by name. Never `git add -A`, `git add .`.
- First run `git status --short` in each directory. For a patch:
  `git diff -U3` (`diff.context` is 0 here).
- An edit made in the wrong directory, moved to the right one:
  `git diff -U3 <file> | git -C <right dir> apply && git checkout <file>`.

## Code style

- Original files: BlueWallet style (prettier, 140 columns).
- `web/`, `lifcoin/`: lif-kernel conventions, 2 spaces, 80 columns.
- BlueWallet bugs that do not block: 1-2 lines in `web/tasks.txt`, no fix.
  lif-kernel bugs: tell the user.

## Run

- 4210: the app, from the layer directory under test:
  `cd ~/BlueWallet-lif && node ~/lif-kernel/web/serve.js -p 4210`
- 4211: lif-kernel test instance. Always `--no-peer`. Chrome debug: 9222.
- After a change: fetch `/.lif/kernel/cache_clear`, `/.lif/kernel/terminate`.
- No working tsc, eslint, prettier: verify in the app.
- Test an anycoin edit before commit: `git diff -U3` there, `git apply`
  in ~/BlueWallet-lif, test, `git apply -R`.

## TCP sockets

`web/stubs/react-native-tcp-socket.js`: BlueWallet's `net` and `tls`.
- `Socket`: `tcp_sock` of `lif-kernel/net/tcpip.js`. A lif-net out node
  makes the real connection. IPv4 only.
- `TLSSocket(socket, opt)`: wraps a `Socket`, sets `socket.opt.tls`. TLS
  ends at the out node. An `error` event without a listener is dropped.

## LIF

`lifcoin/electrum.ts`: `wallet.electrum` of a LIF wallet. Not as BlueElectrum:
- Server: the LIF node, lifnet topic `lifcoin/electrum`. No out node, no
  TCP, no server list. Connects on first use. Offline mode does not apply.
- Verbose transactions are built from the hex: the node gives few fields.
- No `blockchain.scripthash.get_mempool`: mempool comes from the history.
- One fee rate, about 5000 sat/vbyte. Caches in memory only.
- `lifcoin/network.ts`: bech32 `lif`, path `m/84'/1842'/0'`, price fixed
  at 0.01 USD. `lifcoin/index.ts` registers `HDLifWallet`.

## Tests

- The user's Bitcoin test mnemonic is a real wallet. Never broadcast from
  it: stop at the Confirm screen. Never print a mnemonic.
- LIF test wallet "claude lif test" holds the user's LIF. Keys:
  `~/claude_lif.json`. Never press "Send now": the user does.
- By day: a sanity test only. Full and negative tests at night.
- Log each code change in `~/lif-coin/prompt.txt`: `USER:`, `CLAUDE:`, `---`.
