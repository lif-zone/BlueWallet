# BlueWallet web port

Porting BlueWallet (React Native) to run on the web, on lif-kernel.

For work on the web port, ignore `../CLAUDE.md` (BlueWallet's own file, kept
identical to upstream) and use only this file.

## Layout
- Everything of the port is under `web/`, and in the `lif` section of
  `package.json`. `web/stubs/` holds the web versions of the native packages.
- The original BlueWallet files stay identical to upstream. A difference
  between the web and the phone is handled in `web/` or in the `lif` section
  of `package.json` (dependencies, patches), not in the original code.
- `package.json` outside its `lif` section stays identical to upstream.
- No real code in `package.json`: a patch only catches a line and points it
  to a file under `web/`.

## JS coding conventions (same as lif-wallet)
- No spaces around arrow functions: (a, b)=>code
- No spaces around === and ==
- Use == for string and simple number comparison
- No .then() — use await (async IIFE inside useEffect for cleanup)
- No statements on same line as if ()
- No space after async: async()=>...
- catch(e){ — no space before (
- Section comments: // Section Name (no box-drawing)
- if/for/while: statement on next line, not same line
