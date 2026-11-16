#!/usr/bin/env node
// Generates web/loc_requires.json: the files loc/index.ts loads with
// require() when a language is applied, by language code:
//   json: the strings of the language (require('./xx.json'))
//   dayjs: its date locale (require('dayjs/locale/xx'))
// The browser cannot require() synchronously, so web/main.tsx loads them
// ahead and registers them (see web/node_env.js). Run from the project root
// after loc/index.ts gets a new language:
//   node web/loc_requires_gen.mjs
import fs from 'fs';

let src = fs.readFileSync('loc/index.ts', 'utf8');
let res = {json: {}, dayjs: {}};
// ar: () => require('./ar.json'),   'kk@Cyrl': () => require('./kk@Cyrl.json'),
for (let m of src.matchAll(/^\s*'?([\w@]+)'?: \(\) => require\('(\.\/[^']+\.json)'\)/gm))
  res.json[m[1]] = m[2];
// case 'bg_bg': [case ...] ... require('dayjs/locale/bg');
let cases = [];
for (let line of src.split('\n')){
  let m;
  if (m = /^\s*case '([^']+)':/.exec(line))
    cases.push(m[1]);
  else if (m = /require\('(dayjs\/locale\/[^']+)'\)/.exec(line)){
    for (let lang of cases)
      res.dayjs[lang] = m[1];
    cases = [];
  } else if (/^\s*(break;|default:)/.test(line))
    cases = [];
}
for (let file of Object.values(res.json)){
  if (!fs.existsSync('loc/'+file))
    throw Error('missing loc/'+file);
}
fs.writeFileSync('web/loc_requires.json', JSON.stringify(res, null, 1)+'\n');
console.log('web/loc_requires.json:', Object.keys(res.json).length,
  'languages,', Object.keys(res.dayjs).length, 'date locales');
