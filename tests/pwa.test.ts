import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
function worker() { const events:Record<string,(e:any)=>void>={}; const cached:string[]=[]; const context={self:{location:{origin:'https://portal.test'},addEventListener:(k:string,fn:any)=>events[k]=fn,skipWaiting(){},clients:{claim:async()=>{}}},caches:{open:async()=>({addAll:async(paths:string[])=>cached.push(...paths)}),keys:async()=>[],match:async()=>new Response('offline')},fetch:async()=>new Response('network'),URL,Response};vm.runInNewContext(source,context);return {events,cached,context}; }
test('Offline cache contains only public assets, never portal/login/reports', async()=>{
  const w=worker();let done:Promise<void>=Promise.resolve();w.events.install({waitUntil:(p:Promise<void>)=>done=p});await done;
  assert.ok(w.cached.includes('/offline.html'));
  for (const path of ['/','/login','/setting','/api/reports']) assert.ok(!w.cached.includes(path));
});
test('API, RSC, external reports and writes bypass service-worker cache',()=>{
  const w=worker();
  for (const request of [{url:'https://portal.test/api/reports',method:'GET',mode:'same-origin'},{url:'https://portal.test/?_rsc=test',method:'GET',mode:'cors'},{url:'https://app.powerbi.com/view',method:'GET',mode:'navigate'},{url:'https://portal.test/api/auth/login',method:'POST',mode:'cors'}]) {
    let intercepted=false;w.events.fetch({request,respondWith:()=>intercepted=true});assert.equal(intercepted,false);
  }
});
test('Navigation uses network and returns generic offline fallback only on failure',async()=>{
  const w=worker();let response:Promise<Response>|undefined;
  const event={request:{url:'https://portal.test/',method:'GET',mode:'navigate'},respondWith:(r:Promise<Response>)=>response=r};
  w.events.fetch(event);assert.equal(await (await response!).text(),'network');
  w.context.fetch=async()=>{throw new Error('Offline')};w.events.fetch(event);assert.equal(await (await response!).text(),'offline');
});
