// One-off: adds machine-readable fields to rules whose values were prose. Safe to re-run.
const fs=require('fs'),path=require('path');const p=path.join(__dirname,'..','rules','ty2026-27.json');
const j=JSON.parse(fs.readFileSync(p,'utf8'));const r=id=>j.rules.find(x=>x.id===id);
Object.assign(r('A-07').value,{senior_age:60,super_senior_age:80});
Object.assign(r('A-37').value,{pct_full:100,pct_half:50,qualifying_limit_pct_of_adjusted_gti:10});
Object.assign(r('A-38').value,{excess_over_pct_of_total_income:10,monthly_cap:5000,pct_of_total_income_cap:25});
Object.assign(r('A-65').value,{adjusted_total_income_threshold_ind_huf:2000000});
Object.assign(r('D-10').value,{exempt_floor:100000,exempt_pct_of_total_donations:5});
Object.assign(r('E-08').value,{min_paid_pct_of_assessed_tax:90});
fs.writeFileSync(p,JSON.stringify(j,null,1));console.log('patched');
