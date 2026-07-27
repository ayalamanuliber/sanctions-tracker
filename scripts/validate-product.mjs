import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root=process.cwd();
const cases=JSON.parse(fs.readFileSync(path.join(root,"data/sanctions.json"),"utf8"));
const required=["id","case_name","country","date","severity"];
const failures=[]; const warnings=[];
for(const [index,item] of cases.entries()){
 for(const field of required) if(!item[field]) failures.push(`row ${index+1}: missing ${field}`);
 if(!item.court) warnings.push(`row ${index+1}: court not recorded`);
 if(!item.summary) warnings.push(`row ${index+1}: summary not recorded`);
 if(item.source_url && !/^https?:\/\//.test(item.source_url)) failures.push(`row ${index+1}: invalid source_url`);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date||"")) failures.push(`row ${index+1}: invalid date`);
}
const requiredRoutes=["app/cases/page.tsx","app/cases/[slug]/page.tsx","app/topics/page.tsx","app/map/page.tsx","app/analytics/page.tsx","app/sources/page.tsx","app/dashboard/page.tsx","app/use-with-ai/page.tsx","app/filing-gate/page.tsx","app/filing-integrity-scanner/page.tsx","app/control-maturity/page.tsx","app/policy-studio/page.tsx","app/resources/page.tsx","app/workflows/page.tsx","app/privacy/page.tsx","app/terms/page.tsx","app/sitemap.ts","app/robots.ts"];
for(const file of requiredRoutes) if(!fs.existsSync(path.join(root,file))) failures.push(`missing route: ${file}`);
const linked=cases.filter(item=>item.source_url).length;
const alleged=cases.filter(item=>item.alleged).length;
const countries=new Set(cases.map(item=>item.country).filter(Boolean)).size;
if(failures.length){console.error(failures.slice(0,50).join("\n"));console.error(`Validation failed with ${failures.length} issue(s).`);process.exit(1)}
console.log(JSON.stringify({status:"pass",cases:cases.length,sourceLinked:linked,sourceCoverage:`${Math.round(linked/cases.length*1000)/10}%`,alleged,countries,routes:requiredRoutes.length,reviewWarnings:warnings.length},null,2));
