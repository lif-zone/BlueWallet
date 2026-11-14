# BlueWallet-web coding conventions
# Porting BlueWallet (React Native) to run on web via lif-kernel at port 4202

## JS Coding Conventions (same as lif-wallet)
- No spaces around arrow functions: (a, b)=>code
- No spaces around === and ==
- Use == for string and simple number comparison
- No .then() — use await (async IIFE inside useEffect for cleanup)
- No statements on same line as if ()
- No space after async: async()=>...
- catch(e){ — no space before (
- Section comments: // Section Name (no box-drawing)
- if/for/while: statement on next line, not same line

