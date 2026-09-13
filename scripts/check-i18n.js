#!/usr/bin/env node
/* 校验各语言包与 data.js 的结构对齐（节点数）与覆盖率 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext('this.window = this; var TIPS = this.TIPS = {};', sandbox);
const load = (p) => vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox);

load(path.join(__dirname, '../assets/js/data.js'));
const SHEETS = vm.runInContext('SHEETS', sandbox);

const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['en','zh-TW','ja','ko','fr','de','it','ru','es','ar'];
let fail = false;

for (const lang of langs) {
  const f = path.join(__dirname, `../assets/js/i18n/content-${lang}.js`);
  if (!fs.existsSync(f)) { console.log(`[${lang}] MISSING FILE`); fail = true; continue; }
  load(f);
  const C = vm.runInContext(`CONTENT['${lang}']`, sandbox);
  if (!C) { console.log(`[${lang}] CONTENT.${lang} undefined`); fail = true; continue; }
  let issues = [], translated = 0, total = 0;
  SHEETS.forEach((sheet, si) => {
    const loc = C[si];
    if (!loc) { issues.push(`sheet#${si} (${sheet.id}) missing`); return; }
    sheet.sections.forEach((sec, xi) => {
      const lsec = loc.sections && loc.sections[xi];
      if (!lsec) { issues.push(`${sheet.id}/${sec.title}: section missing`); return; }
      if (lsec.descs.length !== sec.items.length)
        issues.push(`${sheet.id}/「${sec.title}」: ${lsec.descs.length} vs ${sec.items.length} 条`);
      const n = Math.min(lsec.descs.length, sec.items.length);
      for (let i = 0; i < n; i++) if (String(lsec.descs[i]).trim()) translated++;
      total += sec.items.length;
    });
    if (sheet.sections.length !== (loc.sections || []).length)
      issues.push(`${sheet.id}: sections ${loc.sections.length} vs ${sheet.sections.length}`);
  });
  const cover = (100 * translated / total).toFixed(1);
  console.log(`[${lang}] sections OK? ${issues.length === 0 ? '✅' : '❌'} | coverage ${translated}/${total} (${cover}%)`);
  issues.forEach((m) => { console.log('   -', m); fail = true; });
}
process.exit(fail ? 1 : 0);
