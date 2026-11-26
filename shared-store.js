(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.XSectionStore=api;})(globalThis,function(){
 'use strict';const clone=v=>JSON.parse(JSON.stringify(v)),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const fail=m=>Object.assign(Error(m),{conflict:true});
 function merge(base,local,remote,path='request'){
  if(equal(local,base))return remote===undefined?undefined:clone(remote);if(equal(remote,base)||equal(local,remote))return local===undefined?undefined:clone(local);
  if(Array.isArray(base)&&Array.isArray(local)&&Array.isArray(remote)&&path.endsWith('.messages')){
   const result=[];for(const id of new Set([...remote,...local,...base].map(m=>m.id))){const v=merge(base.find(m=>m.id===id),local.find(m=>m.id===id),remote.find(m=>m.id===id),path+'.'+id);if(v!==undefined)result.push(v);}return result;
  }
  if(base&&local&&remote&&![base,local,remote].some(v=>typeof v!=='object'||Array.isArray(v))){const result={};for(const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){const v=merge(base[key],local[key],remote[key],path+'.'+key);if(v!==undefined)result[key]=v;}return result;}
  throw fail('Another user changed '+path+'. Your changes are retained. Download a backup before refreshing, then compare the two versions.');
 }
 function valid(r){
  if(!r||typeof r!=='object'||!/^XS-[A-Z0-9-]{5,70}$/.test(r.id||''))throw Error('Invalid request ID.');
  if(!['open','progress','review','done','closed'].includes(r.status))throw Error('Invalid request status.');
  if(!Array.isArray(r.messages)||r.messages.length>1000)throw Error('Invalid request messages.');
  const image=s=>typeof s==='string'&&s.length<=6000000&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\r\n]+$/.test(s);
  if(r.canvasDrawing&&!image(r.canvasDrawing))throw Error('Cut drawings must be PNG, JPEG, WebP or GIF images.');
  if(r.analyst&&!/^[A-Za-z0-9_-]{1,128}$/.test(r.analyst))throw Error('Invalid analyst ID.');
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(r.requester||''))throw Error('Invalid requester ID.');
  for(const m of r.messages){if(!/^[A-Za-z0-9_-]{1,128}$/.test(m.id||'')||!/^[A-Za-z0-9_-]{1,128}$/.test(m.author||'')||typeof m.text!=='string'||!Array.isArray(m.images)||m.images.length>12||m.images.some(s=>!image(s))||!Array.isArray(m.measurements)||m.measurements.some(s=>typeof s!=='string'))throw Error('Invalid message or attachment.');}
  if(JSON.stringify(r).length>8000000)throw Error('This request is too large. Use fewer or smaller images.');return r;
 }
 function create({databaseURL,auth,fetch:fetcher=globalThis.fetch.bind(globalThis)}){
  const base=databaseURL.replace(/\/$/,'')+'/xsectionSharedV1/requests';let serial=Promise.resolve();
  async function call(method,key='',value,etag){const token=await auth.token();if(!token)throw Error('X-section could not establish a shared connection.');const headers={'X-Firebase-ETag':'true',...(value===undefined?{}:{'Content-Type':'application/json'}),...(etag?{'if-match':etag}:{})};let r;try{r=await fetcher(base+(key?'/'+key:'')+'.json?auth='+encodeURIComponent(token),{method,headers,...value===undefined?{}:{body:JSON.stringify(value)},cache:'no-store',signal:AbortSignal.timeout(25000)});}catch{throw Error('The shared database could not be reached. Your unsaved changes are retained; retry or download a backup.');}if(r.status===412)return {collision:true};if(!r.ok)throw Error(r.status===401||r.status===403?'Publish the updated X-section database rules from Shared setup. Your changes are retained.':'Shared saving returned HTTP '+r.status+'. Your changes are retained.');return {value:await r.json(),etag:r.headers.get('ETag')};}
  function decode(row){if(!row||typeof row.dataJSON!=='string')throw Error('A shared request is invalid. Contact the owner; no data was replaced.');return valid(JSON.parse(row.dataJSON));}
  async function read(){const data=(await call('GET')).value||{},out=[];for(const row of Object.values(data))if(!row.deleted)out.push(decode(row));return out.sort((a,b)=>String(b.created).localeCompare(String(a.created))||b.id.localeCompare(a.id));}
  async function writeOne(id,before,local){
   for(let attempt=0;attempt<5;attempt++){
    const current=await call('GET',id),row=current.value,remote=row&&!row.deleted?decode(row):undefined;
    if(row?.deleted&&local!==undefined)throw fail('This request was archived elsewhere. Your version is retained in the browser; download a backup.');
    const result=merge(before,local,remote,id);if(equal(result,remote))return;
    if(result===undefined&&!auth.isOwner())throw Error('Only the verified owner can remove a shared request.');if(result!==undefined)valid(result);
    const value={schema:1,dataJSON:JSON.stringify(result===undefined?remote:result),deleted:result===undefined,revision:(row?.revision||0)+1,createdBy:row?.createdBy||auth.user().uid,updatedBy:auth.user().uid,updatedAt:{'.sv':'timestamp'}};
    const saved=await call('PUT',id,value,current.etag||'null_etag');if(!saved.collision)return;
   }throw fail('Several users are updating this request. Your changes are retained; retry saving.');
  }
  function save(local,baseline){const snapshot=clone(local),original=clone(baseline);const run=async()=>{for(const r of snapshot)valid(r);for(const id of new Set([...snapshot,...original].map(r=>r.id))){const before=original.find(r=>r.id===id),after=snapshot.find(r=>r.id===id);if(!equal(before,after))await writeOne(id,before,after);}return read();};const next=serial.then(run,run);serial=next.catch(()=>{});return next;}
  return {read,save};
 }
 return {create,merge,valid};
});
