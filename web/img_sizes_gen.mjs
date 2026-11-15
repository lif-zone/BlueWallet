#!/usr/bin/env node
// Generates web/img_sizes.json: the size and the available @2x/@3x scales of
// every image under img/. The browser needs them for require('../img/x.png')
// (see web/node_env.js), since an <Image> without a style gets its size from
// the image file. Run from the project root after adding or changing images:
//   node web/img_sizes_gen.mjs
import fs from 'fs';
import path from 'path';

function png_size(file){
  let buf = fs.readFileSync(file);
  if (buf.toString('latin1', 1, 4)!='PNG')
    return;
  return {width: buf.readUInt32BE(16), height: buf.readUInt32BE(20)};
}

function files_list(dir){
  let res = [];
  for (let e of fs.readdirSync(dir, {withFileTypes: true})){
    let file = path.join(dir, e.name);
    if (e.isDirectory())
      res.push(...files_list(file));
    else if (/\.png$/.test(e.name))
      res.push(file);
  }
  return res.sort();
}

let sizes = {};
let files = files_list('img');
for (let file of files){
  if (/@\dx\.png$/.test(file))
    continue;
  let size = png_size(file);
  if (!size)
    continue;
  let scales = [1];
  for (let scale of [2, 3]){
    if (files.includes(file.replace(/\.png$/, '@'+scale+'x.png')))
      scales.push(scale);
  }
  sizes['/'+file] = {...size, scales};
}
fs.writeFileSync('web/img_sizes.json', JSON.stringify(sizes, null, 2)+'\n');
console.log('web/img_sizes.json: '+Object.keys(sizes).length+' images');
