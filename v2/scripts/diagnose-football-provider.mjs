/** Explicit operator-only diagnostic. Never writes raw or normalized licensed data to disk. */
import {readFileSync} from 'node:fs';
import {collectCompetition,validateRegistry} from '../src/lib/football-data-adapter.mjs';
const registry=JSON.parse(readFileSync(new URL('../config/football-provider.json',import.meta.url),'utf8'));
validateRegistry(registry);
const id=process.argv[2];
if(!registry.enabled){console.log('SPORTS_PROVIDER_DISABLED: no network request, no data saved');process.exit(0);}
if(!id){console.error('Specify one enabled competition id');process.exit(1);}
try{
 const snapshot=await collectCompetition(registry,id,{now:new Date().toISOString().replace(/\.\d{3}Z$/,'Z'),token:process.env.FOOTBALL_DATA_API_TOKEN});
 console.log(JSON.stringify({status:'VALIDATED_IN_MEMORY_ONLY',competition:snapshot.competition,checkedAt:snapshot.checkedAt,expiresAt:snapshot.expiresAt,tableRows:snapshot.table?.length??0,upcomingCount:snapshot.upcoming.length,latency:snapshot.latency}));
}catch(e){console.error('SPORTS_DIAGNOSTIC_FAILED: '+e.message);process.exitCode=1;}
