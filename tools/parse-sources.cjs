#!/usr/bin/env node
/* Parse the two source PDFs into JSON tables for tools/build-kb.cjs.
   Install the parser outside the repo first:  npm install --no-save --prefix "$env:TEMP\bizmatrix-tools" pdfjs-dist@3.11.174
   Usage: node tools/parse-sources.cjs --pdfjs "$env:TEMP\bizmatrix-tools\node_modules\pdfjs-dist" --regmap <Registration_Master_Map.pdf> --compliance <Compliance_Master.pdf> --out <dir>
   Writes <dir>/regmap.json and <dir>/compliance.json. */
"use strict";
const fs=require("fs"),path=require("path");
const arg=k=>{const i=process.argv.indexOf("--"+k);if(i<0)throw new Error("missing --"+k);return process.argv[i+1]};
const pdfjs=require(path.join(arg("pdfjs"),"legacy/build/pdf.js"));const S=arg("out");fs.mkdirSync(S,{recursive:true});
async function items(file){const d=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(file)),verbosity:0}).promise,out=[];for(let i=1;i<=d.numPages;i++){const c=await (await d.getPage(i)).getTextContent();for(const it of c.items){if(!it.str.trim())continue;out.push({p:i,x:Math.round(it.transform[4]*10)/10,y:Math.round(it.transform[5]*10)/10,s:it.str})}}return out}
(async()=>{
const regItems=await items(arg("regmap")),compItems=await items(arg("compliance"));
const norm=s=>s.replace(/\s+/g," ").replace(/ - /g," – ").trim();
function joinCell(parts){ // parts sorted by y desc; join with smart hyphen handling
  let o="";for(const t of parts){if(!o)o=t;else if(/[-\/]$/.test(o)&&!/ -$/.test(o))o+=t;else o+=" "+t}return norm(o)}

/* ---------- Registration master map: Part C (21-24) & Part D (25-30) & Part F (33-35) ---------- */
function tables(items,pages,anchorRe,headFirst){
  const rows=[];let cat="";
  for(const p of pages){
    const pg=items.filter(i=>i.p===p).sort((a,b)=>b.y-a.y||a.x-b.x);
    let cols=null,cur=null;
    for(const it of pg){
      if(it.s===headFirst){ // header line: collect items on same y (and y-8.1 continuation)
        cols=pg.filter(j=>Math.abs(j.y-it.y)<0.5).map(j=>({x:j.x,h:j.s})).sort((a,b)=>a.x-b.x);
        cur=null;continue}
      if(it.x<41&&it.s.length<60&&!/MASTER MAP|Law stated|Page|PART|Part [A-H]|These apply|Fees and/.test(it.s)){cat=norm(it.s);cur=null;continue}
      if(!cols)continue;
      if(cols.some(c=>Math.abs(c.x-it.x)<0.6)&&pg.some(j=>j.s===headFirst&&Math.abs(j.y-it.y)<9&&j.y>it.y))continue; // header continuation
      if(Math.abs(it.x-cols[0].x)<1&&anchorRe.test(it.s)){cur={cat,cells:cols.map(()=>[])};cur.cells[0].push(it.s);rows.push(cur);continue}
      if(it.x<cols[0].x-3){ // left-margin text = section heading or page furniture
        if(it.s.length<60&&!/MASTER MAP|Law stated|Page|PART/.test(it.s)){cat=norm(it.s)}cur=null;continue}
      if(!cur)continue;
      let ci=0;for(let k=0;k<cols.length;k++)if(it.x>=cols[k].x-1)ci=k;
      cur.cells[ci].push(it.s);
    }
    if(cols)rows.forEach(r=>{if(!r.heads)r.heads=cols.map(c=>c.h)});
  }
  return rows.map(r=>{const o={category:r.cat};r.heads.forEach((h,i)=>o[h]=joinCell(r.cells[i]));return o});
}
const reg=regItems;
const partC=tables(reg,[21,22,23,24],/^[A-Z]\d{2}$/,"ID");
const partD=tables(reg,[25,26,27,28,29,30],/^I\d{2}$/,"ID");
const partF=tables(reg,[33,34,35],/^[A-Z]\d{2}$/,"ID");
fs.writeFileSync(S+"/regmap.json",JSON.stringify({partC,partD,partF},null,1));
console.log("C",partC.length,"D",partD.length,"F",partF.length);
console.log(JSON.stringify(partC[0]),"\n",JSON.stringify(partD[0]),"\n",JSON.stringify(partF[0]));

/* ---------- Compliance master: entity N(a) initial / N(b) annual ---------- */
const comp=compItems;
const ENTS={"Sole Proprietorship":"sole","Partnership Firm":"partnership","Limited Liability Partnership":"llp","Private Limited Company":"private_limited","Public Limited Company":"public_limited","Section 8 Company":"section8","One Person Company":"opc"};
const out=[];let ent=null,part=null,cols=null,cur=null;
const maxP=Math.max(...comp.map(i=>i.p));
for(let p=1;p<=maxP;p++){
  const pg=comp.filter(i=>i.p===p).sort((a,b)=>b.y-a.y||a.x-b.x);cols=null;
  for(const it of pg){
    const m=it.x<36&&it.s.match(/^(\d+)\. (.+?)( \(unlisted\))?$/);
    if(m&&ENTS[m[2]]){ent=ENTS[m[2]];part=null;continue}
    const sm=it.x<36&&it.s.match(/^\d+\(([abc])\)/);if(sm){part=sm[1];cur=null;continue}
    if(it.s==="#"&&it.x<34){cols=pg.filter(j=>Math.abs(j.y-it.y)<0.5).map(j=>({x:j.x,h:j.s})).sort((a,b)=>a.x-b.x);cur=null;continue}
    if(!cols||!ent||(part!=="a"&&part!=="b"))continue;
    if(pg.some(j=>j.s==="#"&&j.x<34&&j.y>it.y&&j.y-it.y<9))continue;
    if(Math.abs(it.x-cols[0].x)<1&&/^\d+$/.test(it.s)){cur={entity:ent,part:part==="a"?"initial":"annual",cells:cols.map(()=>[])};cur.cells[0].push(it.s);out.push(cur);continue}
    if(!cur||it.y<25)continue;
    let ci=0;for(let k=0;k<cols.length;k++)if(it.x>=cols[k].x-1)ci=k;
    if(ci===0){cur.freq=it.s;continue}
    cur.cells[ci].push(it.s);
  }
}
const KEY=["no","compliance","law","form","authority","due","applicability","penalty","source","status"];
const compRows=out.map(r=>{const o={entity:r.entity,part:r.part,freq:r.freq||""};KEY.forEach((k,i)=>o[k]=joinCell(r.cells[i]||[]));o.no=+o.no;return o});
fs.writeFileSync(S+"/compliance.json",JSON.stringify(compRows,null,1));
const cnt={};compRows.forEach(r=>{const k=r.entity+"/"+r.part;cnt[k]=(cnt[k]||0)+1});console.log(cnt);
console.log(JSON.stringify(compRows[7]));console.log(JSON.stringify(compRows.find(r=>r.entity==="private_limited"&&r.part==="annual")));

})();
